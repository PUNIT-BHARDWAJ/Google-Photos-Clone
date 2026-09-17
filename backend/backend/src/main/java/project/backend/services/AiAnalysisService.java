package project.backend.services;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.atomic.AtomicInteger;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.task.TaskRejectedException;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

import jakarta.annotation.PreDestroy;
import project.backend.config.GeminiProperties;
import project.backend.domain.Photo;
import project.backend.domain.PhotoStatus;
import project.backend.domain.User;
import project.backend.dto.AiJobResponse;
import project.backend.dto.AiStatusResponse;
import project.backend.dto.AnalyzeAllResponse;
import project.backend.dto.ImageAnalysis;
import project.backend.dto.PhotoResponse;
import project.backend.exception.GeminiException;
import project.backend.exception.GeminiException.Kind;
import project.backend.exception.ImageKitUploadException;
import project.backend.exception.ResourceNotFoundException;
import project.backend.repository.PhotoRepository;

/**
 * Runs Gemini photo analysis: automatically after each upload (background
 * thread, after the upload transaction commits), on demand for one photo, and
 * as a cancellable per-user bulk run that spaces requests bulk-delay-ms apart.
 * The executors are private rather than beans so @EnableAsync isn't needed and
 * Spring Boot's default application task executor stays as it is.
 */
@Service
public class AiAnalysisService {

    private static final Logger log = LoggerFactory.getLogger(AiAnalysisService.class);

    static final List<PhotoStatus> ANALYZABLE_STATUSES = List.of(PhotoStatus.ACTIVE, PhotoStatus.ARCHIVE);
    private static final int MAX_ERROR_LENGTH = 500;
    private static final long RATE_LIMIT_WAIT_MS = 60_000;
    private static final int RATE_LIMIT_RETRIES = 2;
    private static final int MAX_CONSECUTIVE_OVERLOADED = 3;
    private static final long CANCEL_POLL_MS = 200;

    private final PhotoRepository photoRepository;
    private final ImageKitService imageKitService;
    private final GeminiService geminiService;
    private final GeminiProperties properties;
    private final AiQueueTracker aiQueueTracker;
    private final PhotoService photoService;

    private final ThreadPoolTaskExecutor analysisExecutor;
    private final ExecutorService bulkExecutor = Executors.newThreadPerTaskExecutor(
            Thread.ofVirtual().name("ai-bulk-", 0).factory());
    private final Map<UUID, BulkJob> jobs = new ConcurrentHashMap<>();

    public AiAnalysisService(
            PhotoRepository photoRepository,
            ImageKitService imageKitService,
            GeminiService geminiService,
            GeminiProperties properties,
            AiQueueTracker aiQueueTracker,
            PhotoService photoService
    ) {
        this.photoRepository = photoRepository;
        this.imageKitService = imageKitService;
        this.geminiService = geminiService;
        this.properties = properties;
        this.aiQueueTracker = aiQueueTracker;
        this.photoService = photoService;

        // Two workers are plenty: the shared rate limiter is the real throttle.
        // A full queue drops the task; the photo just waits for "Analyze all".
        this.analysisExecutor = new ThreadPoolTaskExecutor();
        analysisExecutor.setCorePoolSize(2);
        analysisExecutor.setMaxPoolSize(2);
        analysisExecutor.setQueueCapacity(1000);
        analysisExecutor.setThreadNamePrefix("ai-analysis-");
        analysisExecutor.initialize();
    }

    @PreDestroy
    void shutdown() {
        jobs.values().forEach(job -> job.cancelRequested = true);
        bulkExecutor.shutdownNow();
        analysisExecutor.shutdown();
    }

    // ---- After upload -----------------------------------------------------

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT, fallbackExecution = true)
    public void onPhotoUploaded(PhotoUploadedEvent event) {
        if (!geminiService.isConfigured()) {
            return;
        }
        UUID photoId = event.photoId();
        if (!aiQueueTracker.markPending(photoId)) {
            return;
        }
        try {
            analysisExecutor.execute(() -> {
                try {
                    analyzeInBackground(photoId);
                } finally {
                    aiQueueTracker.clear(photoId);
                }
            });
        } catch (TaskRejectedException ex) {
            aiQueueTracker.clear(photoId);
            log.warn("AI analysis queue is full; photo {} will be picked up by \"Analyze all\"", photoId);
        }
    }

    private void analyzeInBackground(UUID photoId) {
        Photo photo = photoRepository.findById(photoId).orElse(null);
        if (photo == null || photo.getStatus() == PhotoStatus.TRASH) {
            return;
        }
        try {
            saveAnalysis(photoId, analyze(photo));
        } catch (GeminiException | ImageKitUploadException ex) {
            log.info("AI analysis failed for photo {}: {}", photoId, ex.getMessage());
            recordFailure(photoId, ex);
        } catch (RuntimeException ex) {
            log.warn("Unexpected AI analysis failure for photo {}", photoId, ex);
            photoRepository.saveAiError(photoId, "AI analysis failed unexpectedly");
        }
    }

    // ---- One photo, on demand ---------------------------------------------

    public PhotoResponse analyzeNow(User user, UUID photoId) {
        Photo photo = photoRepository.findByIdAndUserId(photoId, user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Photo not found"));
        if (!geminiService.isConfigured()) {
            throw GeminiException.notConfigured();
        }

        boolean marked = aiQueueTracker.markPending(photoId);
        try {
            saveAnalysis(photoId, analyze(photo));
        } catch (GeminiException | ImageKitUploadException ex) {
            recordFailure(photoId, ex);
            throw ex;
        } finally {
            if (marked) {
                aiQueueTracker.clear(photoId);
            }
        }
        return photoService.getPhoto(user, photoId);
    }

    // ---- Bulk -------------------------------------------------------------

    public AnalyzeAllResponse startAnalyzeAll(User user) {
        if (!geminiService.isConfigured()) {
            throw GeminiException.notConfigured();
        }

        UUID userId = user.getId();
        synchronized (jobs) {
            BulkJob existing = jobs.get(userId);
            if (existing != null && existing.running) {
                int remaining = existing.total - existing.processed.get();
                return new AnalyzeAllResponse(remaining, "Analysis is already running (" + remaining + " photos left)");
            }

            List<UUID> photoIds = photoRepository.findIdsNeedingAiAnalysis(userId, ANALYZABLE_STATUSES);
            if (photoIds.isEmpty()) {
                return new AnalyzeAllResponse(0, "All photos are already analyzed");
            }

            BulkJob job = new BulkJob(photoIds.size());
            jobs.put(userId, job);
            bulkExecutor.execute(() -> runBulk(job, photoIds));
            return new AnalyzeAllResponse(photoIds.size(),
                    "Analysis started for " + photoIds.size() + " photo" + (photoIds.size() == 1 ? "" : "s"));
        }
    }

    public void cancelAnalyzeAll(User user) {
        BulkJob job = jobs.get(user.getId());
        if (job != null && job.running) {
            job.cancelRequested = true;
        }
    }

    private void runBulk(BulkJob job, List<UUID> photoIds) {
        String stopReason = null;
        try {
            for (int i = 0; i < photoIds.size(); i++) {
                if (i > 0 && !pause(job, properties.bulkDelayMs())) {
                    break;
                }
                if (job.cancelRequested) {
                    break;
                }

                UUID photoId = photoIds.get(i);
                stopReason = analyzeForBulk(job, photoId);
                job.processed.incrementAndGet();
                if (stopReason != null) {
                    break;
                }
            }
        } catch (RuntimeException ex) {
            log.warn("Bulk AI analysis stopped unexpectedly", ex);
            stopReason = "Stopped: something went wrong";
        } finally {
            job.finish(job.cancelRequested ? "Stopped" : stopReason != null ? stopReason : "Finished");
        }
    }

    /** Analyzes one photo of a bulk run. Returns a reason when the whole run should stop. */
    private String analyzeForBulk(BulkJob job, UUID photoId) {
        Photo photo = photoRepository.findById(photoId).orElse(null);
        // Deleted, trashed, or analyzed by an upload meanwhile - nothing to do.
        if (photo == null || photo.getStatus() == PhotoStatus.TRASH || photo.getAiProcessedAt() != null) {
            return null;
        }
        if (!aiQueueTracker.markPending(photoId)) {
            return null;
        }

        try {
            for (int attempt = 0; ; attempt++) {
                try {
                    saveAnalysis(photoId, analyze(photo));
                    job.succeeded.incrementAndGet();
                    job.consecutiveOverloaded = 0;
                    return null;
                } catch (GeminiException ex) {
                    if (ex.getKind() == Kind.RATE_LIMITED && attempt < RATE_LIMIT_RETRIES) {
                        // Another feature may have used this minute's quota - wait it out.
                        if (!pause(job, RATE_LIMIT_WAIT_MS)) {
                            return null;
                        }
                        continue;
                    }
                    recordFailure(photoId, ex);
                    job.failed.incrementAndGet();
                    // One overloaded answer is noise; several in a row means every
                    // remaining photo would fail the same way, slowly.
                    job.consecutiveOverloaded = ex.getKind() == Kind.OVERLOADED ? job.consecutiveOverloaded + 1 : 0;
                    return switch (ex.getKind()) {
                        case RATE_LIMITED -> "Paused: Gemini's rate limit was reached. Try again in a few minutes.";
                        case INVALID_KEY, NOT_CONFIGURED, MODEL_UNAVAILABLE, QUOTA_EXHAUSTED -> "Stopped: " + ex.getMessage();
                        case OVERLOADED -> job.consecutiveOverloaded >= MAX_CONSECUTIVE_OVERLOADED
                                ? "Paused: Gemini is overloaded right now. Try again in a few minutes."
                                : null;
                        default -> null;
                    };
                } catch (ImageKitUploadException ex) {
                    recordFailure(photoId, ex);
                    job.failed.incrementAndGet();
                    return null;
                }
            }
        } finally {
            aiQueueTracker.clear(photoId);
        }
    }

    /** Sleeps in short steps so Stop takes effect quickly. False if cancelled. */
    private boolean pause(BulkJob job, long millis) {
        long until = System.currentTimeMillis() + millis;
        while (!job.cancelRequested) {
            long left = until - System.currentTimeMillis();
            if (left <= 0) {
                return true;
            }
            try {
                Thread.sleep(Math.min(left, CANCEL_POLL_MS));
            } catch (InterruptedException ex) {
                Thread.currentThread().interrupt();
                job.cancelRequested = true;
            }
        }
        return false;
    }

    // ---- Status -----------------------------------------------------------

    public AiStatusResponse status(User user, boolean refreshConnection) {
        GeminiService.StatusSnapshot connection = geminiService.status(refreshConnection);
        UUID userId = user.getId();
        long total = photoRepository.countByUserIdAndStatusIn(userId, ANALYZABLE_STATUSES);
        long analyzed = photoRepository.countByUserIdAndStatusInAndAiProcessedAtIsNotNull(userId, ANALYZABLE_STATUSES);
        long failed = photoRepository.countByUserIdAndStatusInAndAiProcessedAtIsNullAndAiErrorIsNotNull(userId, ANALYZABLE_STATUSES);

        BulkJob job = jobs.get(userId);
        long secondsPerPhoto = Math.max(1, Math.round(properties.bulkDelayMs() / 1000.0));
        long remaining = job != null && job.running ? Math.max(0, job.total - job.processed.get()) : 0;

        return new AiStatusResponse(
                geminiService.isConfigured(),
                connection.status().name(),
                connection.message(),
                connection.model(),
                total,
                analyzed,
                failed,
                Math.max(0, total - analyzed),
                job != null ? job.toResponse() : null,
                secondsPerPhoto,
                remaining * secondsPerPhoto
        );
    }

    // ---- Helpers ----------------------------------------------------------

    private ImageAnalysis analyze(Photo photo) {
        byte[] image = imageKitService.downloadForAnalysis(photo.getUrl());
        return geminiService.analyzeImage(image, "image/jpeg");
    }

    private void saveAnalysis(UUID photoId, ImageAnalysis analysis) {
        photoRepository.saveAiAnalysis(
                photoId,
                analysis.caption(),
                Photo.joinList(analysis.tags()),
                analysis.sceneType(),
                Photo.joinList(analysis.dominantColors()),
                Instant.now());
    }

    private void recordFailure(UUID photoId, RuntimeException ex) {
        if (ex instanceof GeminiException gemini && gemini.getKind() == Kind.NOT_CONFIGURED) {
            return;
        }
        String message = ex.getMessage() != null ? ex.getMessage() : "AI analysis failed";
        if (message.length() > MAX_ERROR_LENGTH) {
            message = message.substring(0, MAX_ERROR_LENGTH - 1) + "…";
        }
        photoRepository.saveAiError(photoId, message);
    }

    static final class BulkJob {
        final int total;
        final Instant startedAt = Instant.now();
        final AtomicInteger processed = new AtomicInteger();
        final AtomicInteger succeeded = new AtomicInteger();
        final AtomicInteger failed = new AtomicInteger();
        volatile boolean running = true;
        volatile boolean cancelRequested;
        volatile Instant finishedAt;
        volatile String message = "Running";
        // Only touched by the job's own thread.
        int consecutiveOverloaded;

        BulkJob(int total) {
            this.total = total;
        }

        void finish(String finalMessage) {
            message = finalMessage;
            finishedAt = Instant.now();
            running = false;
        }

        AiJobResponse toResponse() {
            return new AiJobResponse(running, cancelRequested, total, processed.get(), succeeded.get(),
                    failed.get(), startedAt, finishedAt, message);
        }
    }
}
