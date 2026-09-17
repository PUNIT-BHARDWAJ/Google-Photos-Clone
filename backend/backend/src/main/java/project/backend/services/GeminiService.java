package project.backend.services;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.net.http.HttpTimeoutException;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.ArrayList;
import java.util.Base64;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.ThreadLocalRandom;
import java.util.function.LongSupplier;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import tools.jackson.databind.JsonNode;
import tools.jackson.databind.json.JsonMapper;
import tools.jackson.databind.node.ArrayNode;
import tools.jackson.databind.node.ObjectNode;

import project.backend.config.GeminiProperties;
import project.backend.dto.EditSuggestion;
import project.backend.dto.ImageAnalysis;
import project.backend.dto.PhotoSummary;
import project.backend.exception.GeminiException;
import project.backend.exception.GeminiException.Kind;

/**
 * All communication with the Gemini REST API (generateContent). Every call
 * goes through one shared rate limiter, retries 429/5xx with exponential
 * backoff inside a 30 second budget, and reports failures as GeminiException
 * with a message safe to show users. Callers decide what runs asynchronously -
 * upload analysis and bulk runs are handed to background executors by
 * AiAnalysisService, so nothing here ever sits on an upload request.
 */
@Service
public class GeminiService {

    private static final Logger log = LoggerFactory.getLogger(GeminiService.class);

    public enum ConnectionStatus {
        NOT_CONFIGURED, UNKNOWN, CONNECTED, RATE_LIMITED, INVALID_KEY, MODEL_UNAVAILABLE, ERROR
    }

    public record StatusSnapshot(ConnectionStatus status, String message, String model) {
    }

    static final String ANALYSIS_PROMPT = """
            Analyze this photo and return a JSON object with these fields:
            {
              "caption": "A natural language description of the photo in one sentence",
              "tags": ["tag1", "tag2"],
              "sceneType": "outdoor|indoor|portrait|landscape|food|document|screenshot|art|animal|vehicle|architecture|night|macro|sport|event",
              "dominantColors": ["color1", "color2"]
            }
            - tags: 5-15 relevant tags, lowercase, single words or short phrases
            - sceneType: exactly one value from the list
            - dominantColors: 2-4 simple color names (for example "blue", "gold", "white")
            Only return the JSON, no markdown, no explanation.
            """;

    static final String EDIT_OPERATIONS = String.join(", ", ImageEditMapper.operationKeys());

    private static final int SEARCH_MAX_PHOTOS = 100;
    private static final long STATUS_CACHE_MS = 5 * 60_000;
    private static final long RATE_LIMIT_STATUS_MS = 60_000;
    private static final long BASE_BACKOFF_MS = 2_000;
    private static final long MAX_BACKOFF_MS = 30_000;

    private final GeminiProperties properties;
    private final GeminiRateLimiter rateLimiter;
    private final HttpClient httpClient;
    private final LongSupplier clock;
    private final JsonMapper mapper = JsonMapper.builder().build();

    private volatile String activeModel;
    private volatile ConnectionStatus status;
    private volatile String statusMessage;
    private volatile long statusAt;

    @Autowired
    public GeminiService(GeminiProperties properties) {
        this(properties,
                new GeminiRateLimiter(properties.requestsPerMinute(), System::currentTimeMillis),
                HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(10)).build(),
                System::currentTimeMillis);
    }

    GeminiService(GeminiProperties properties, GeminiRateLimiter rateLimiter, HttpClient httpClient, LongSupplier clock) {
        this.properties = properties;
        this.rateLimiter = rateLimiter;
        this.httpClient = httpClient;
        this.clock = clock;
        this.activeModel = properties.model();
        this.status = properties.isConfigured() ? ConnectionStatus.UNKNOWN : ConnectionStatus.NOT_CONFIGURED;
    }

    public boolean isConfigured() {
        return properties.isConfigured();
    }

    // ---- Public operations ------------------------------------------------

    public ImageAnalysis analyzeImage(byte[] imageBytes, String mimeType) {
        String text = generate(ANALYSIS_PROMPT, imageBytes, mimeType, true);
        return GeminiResponseParser.parseAnalysis(text);
    }

    /**
     * Re-ranks photos for a natural-language query using only their captions,
     * tags and scene (never the images). Returns the ids Gemini considered
     * relevant, most relevant first; photos it left out are not included.
     */
    public List<UUID> searchByDescription(String query, List<PhotoSummary> photos) {
        if (photos.isEmpty()) {
            return List.of();
        }
        List<PhotoSummary> candidates = photos.size() > SEARCH_MAX_PHOTOS ? photos.subList(0, SEARCH_MAX_PHOTOS) : photos;

        StringBuilder lines = new StringBuilder();
        for (int i = 0; i < candidates.size(); i++) {
            PhotoSummary photo = candidates.get(i);
            lines.append(i + 1).append(" | ")
                    .append(oneLine(photo.caption())).append(" | ")
                    .append(photo.tags() == null ? "" : String.join(", ", photo.tags())).append(" | ")
                    .append(photo.sceneType() == null ? "" : photo.sceneType())
                    .append('\n');
        }

        String prompt = """
                You rank photos from a personal photo library for the search query: "%s"

                Each line describes one photo as: number | caption | tags | scene
                %s
                Return a JSON object {"ranking": [numbers]} listing the numbers of the photos that match the query, most relevant first. Leave out photos that don't match. Only return the JSON.
                """.formatted(oneLine(query), lines);

        String text = generate(prompt, null, null, true);
        List<UUID> ranked = new ArrayList<>();
        for (int position : GeminiResponseParser.parseRanking(text, candidates.size())) {
            ranked.add(candidates.get(position).id());
        }
        return ranked;
    }

    public EditSuggestion editSuggestion(byte[] imageBytes, String mimeType, String instruction) {
        String prompt = """
                You are a photo editing assistant. The user wants to change this photo: "%s"

                Return a JSON object:
                {"suggestion": "1-2 sentences, specific to this photo, on how to achieve the edit", "operations": ["..."]}
                "operations" lists, in order, the operations from this list that best achieve the edit: %s.
                Use an empty list if none of them fit. Only return the JSON, no markdown.
                """.formatted(oneLine(instruction), EDIT_OPERATIONS);

        String text = generate(prompt, imageBytes, mimeType, true);
        return GeminiResponseParser.parseEditSuggestion(text);
    }

    /**
     * The last known connection state. With refresh (or when the cached state
     * is stale) this checks the key and model with a models.get call, which
     * doesn't spend generateContent quota.
     */
    public StatusSnapshot status(boolean refresh) {
        if (!properties.isConfigured()) {
            return new StatusSnapshot(ConnectionStatus.NOT_CONFIGURED,
                    "Add a Gemini API key to enable AI features", activeModel);
        }
        long now = clock.getAsLong();
        boolean recentlyRateLimited = status == ConnectionStatus.RATE_LIMITED && now - statusAt < RATE_LIMIT_STATUS_MS;
        boolean fresh = status != ConnectionStatus.UNKNOWN && now - statusAt < STATUS_CACHE_MS;
        if (recentlyRateLimited || (fresh && !refresh)) {
            return snapshot();
        }
        checkConnection();
        return snapshot();
    }

    // ---- HTTP -------------------------------------------------------------

    private void checkConnection() {
        for (int attempt = 0; attempt < 2; attempt++) {
            String model = activeModel;
            try {
                HttpRequest request = HttpRequest.newBuilder()
                        .uri(URI.create(properties.baseUrl() + "/models/" + model))
                        .header("x-goog-api-key", properties.apiKey())
                        .timeout(Duration.ofSeconds(10))
                        .GET()
                        .build();
                HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
                int code = response.statusCode();
                if (code == 200) {
                    record(ConnectionStatus.CONNECTED, "Connected to " + model);
                    return;
                }
                JsonNode body = GeminiResponseParser.tryParse(response.body());
                if (code == 404 && switchToFallbackModel(model)) {
                    continue;
                }
                throw classifyError(code, body, model);
            } catch (GeminiException ex) {
                // classifyError already recorded the status.
                return;
            } catch (IOException ex) {
                record(ConnectionStatus.ERROR, "Couldn't reach Gemini: " + ex.getClass().getSimpleName());
                return;
            } catch (InterruptedException ex) {
                Thread.currentThread().interrupt();
                return;
            }
        }
    }

    /**
     * One generateContent call with rate limiting, retries and a total budget
     * of timeout-seconds. Returns the model's text.
     */
    String generate(String prompt, byte[] imageBytes, String mimeType, boolean jsonResponse) {
        if (!properties.isConfigured()) {
            throw GeminiException.notConfigured();
        }

        long timeoutMs = properties.timeoutSeconds() * 1000L;
        long deadline = clock.getAsLong() + timeoutMs;
        String body = buildRequestBody(prompt, imageBytes, mimeType, jsonResponse);
        GeminiException lastError = null;

        for (int attempt = 0; attempt <= properties.maxRetries(); attempt++) {
            try {
                if (!rateLimiter.acquire(deadline)) {
                    throw record(new GeminiException(Kind.RATE_LIMITED,
                            "AI is busy right now (rate limit reached). Try again in a minute."), ConnectionStatus.RATE_LIMITED);
                }
            } catch (InterruptedException ex) {
                Thread.currentThread().interrupt();
                throw new GeminiException(Kind.TIMEOUT, "The AI request was interrupted", ex);
            }

            long remaining = deadline - clock.getAsLong();
            if (remaining <= 0) {
                throw lastError != null ? lastError : new GeminiException(Kind.TIMEOUT, "The AI request timed out");
            }

            String model = activeModel;
            HttpResponse<String> response;
            try {
                HttpRequest request = HttpRequest.newBuilder()
                        .uri(URI.create(properties.baseUrl() + "/models/" + model + ":generateContent"))
                        .header("Content-Type", "application/json")
                        .header("x-goog-api-key", properties.apiKey())
                        .timeout(Duration.ofMillis(remaining))
                        .POST(HttpRequest.BodyPublishers.ofString(body, StandardCharsets.UTF_8))
                        .build();
                response = httpClient.send(request, HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8));
            } catch (HttpTimeoutException ex) {
                throw record(new GeminiException(Kind.TIMEOUT,
                        "The AI request timed out after " + properties.timeoutSeconds() + " seconds", ex), null);
            } catch (IOException ex) {
                lastError = record(new GeminiException(Kind.UPSTREAM_ERROR, "Couldn't reach Gemini", ex), ConnectionStatus.ERROR);
                if (!sleepBeforeRetry(backoffMillis(attempt), deadline)) {
                    throw lastError;
                }
                continue;
            } catch (InterruptedException ex) {
                Thread.currentThread().interrupt();
                throw new GeminiException(Kind.TIMEOUT, "The AI request was interrupted", ex);
            }

            int code = response.statusCode();
            JsonNode json = GeminiResponseParser.tryParse(response.body());

            if (code == 200) {
                String text = GeminiResponseParser.extractCandidateText(json);
                if (text == null || text.isBlank()) {
                    String reason = GeminiResponseParser.blockReason(json);
                    throw new GeminiException(Kind.BAD_RESPONSE, reason != null
                            ? "Gemini declined this request (" + reason.toLowerCase().replace('_', ' ') + ")"
                            : "Gemini returned an empty response");
                }
                record(ConnectionStatus.CONNECTED, "Connected to " + model);
                return text;
            }

            if (code == 404 && switchToFallbackModel(model)) {
                attempt--;
                continue;
            }

            GeminiException error = classifyError(code, json, model);
            boolean retryable = error.getKind() == Kind.RATE_LIMITED || code >= 500;
            if (!retryable || attempt == properties.maxRetries()) {
                throw error;
            }
            lastError = error;

            long delay = backoffMillis(attempt);
            if (code == 429) {
                long suggested = GeminiResponseParser.retryDelayMillis(json);
                long retryAfter = response.headers().firstValue("Retry-After")
                        .map(GeminiService::parseRetryAfterSeconds).orElse(-1L);
                delay = Math.max(delay, Math.max(suggested, retryAfter));
                rateLimiter.pauseUntil(clock.getAsLong() + delay);
            }
            log.debug("Gemini returned HTTP {} (attempt {}), retrying in {} ms", code, attempt + 1, delay);
            if (!sleepBeforeRetry(delay, deadline)) {
                throw error;
            }
        }
        throw lastError != null ? lastError : new GeminiException(Kind.UPSTREAM_ERROR, "Gemini request failed");
    }

    private String buildRequestBody(String prompt, byte[] imageBytes, String mimeType, boolean jsonResponse) {
        ObjectNode root = mapper.createObjectNode();
        ArrayNode parts = root.putArray("contents").addObject().putArray("parts");
        if (imageBytes != null) {
            ObjectNode inline = parts.addObject().putObject("inline_data");
            inline.put("mime_type", mimeType != null ? mimeType : "image/jpeg");
            inline.put("data", Base64.getEncoder().encodeToString(imageBytes));
        }
        parts.addObject().put("text", prompt);

        ObjectNode config = root.putObject("generationConfig");
        config.put("temperature", 0.2);
        if (jsonResponse) {
            config.put("responseMimeType", "application/json");
        }
        return mapper.writeValueAsString(root);
    }

    private GeminiException classifyError(int code, JsonNode body, String model) {
        if (code == 429) {
            return record(new GeminiException(Kind.RATE_LIMITED,
                    "AI is busy right now (rate limit reached). Try again in a minute."), ConnectionStatus.RATE_LIMITED);
        }
        if (code == 401 || code == 403 || (code == 400 && GeminiResponseParser.isInvalidKeyError(body))) {
            return record(new GeminiException(Kind.INVALID_KEY,
                    "Gemini rejected the API key. Check gemini.api-key."), ConnectionStatus.INVALID_KEY);
        }
        if (code == 404) {
            return record(new GeminiException(Kind.MODEL_UNAVAILABLE,
                    "The Gemini model \"" + model + "\" isn't available. Set gemini.model to a current model."),
                    ConnectionStatus.MODEL_UNAVAILABLE);
        }
        if (code >= 500) {
            return record(new GeminiException(Kind.UPSTREAM_ERROR,
                    "Gemini is temporarily unavailable (HTTP " + code + ")"), ConnectionStatus.ERROR);
        }
        String upstream = body == null ? null : body.path("error").path("message").asString(null);
        log.warn("Gemini request failed with HTTP {}: {}", code, upstream);
        return new GeminiException(Kind.UPSTREAM_ERROR, "Gemini couldn't process the request (HTTP " + code + ")");
    }

    private boolean switchToFallbackModel(String failedModel) {
        if (!properties.hasFallbackModel() || !failedModel.equals(properties.model())) {
            return false;
        }
        synchronized (this) {
            if (activeModel.equals(properties.model())) {
                log.warn("Gemini model {} is not available; switching to {}", properties.model(), properties.fallbackModel());
                activeModel = properties.fallbackModel();
            }
        }
        return true;
    }

    private GeminiException record(GeminiException error, ConnectionStatus newStatus) {
        if (newStatus != null) {
            record(newStatus, error.getMessage());
        }
        return error;
    }

    private void record(ConnectionStatus newStatus, String message) {
        status = newStatus;
        statusMessage = message;
        statusAt = clock.getAsLong();
    }

    private StatusSnapshot snapshot() {
        return new StatusSnapshot(status, statusMessage, activeModel);
    }

    private long backoffMillis(int attempt) {
        long exponential = BASE_BACKOFF_MS * (1L << Math.min(attempt, 10));
        long jitter = ThreadLocalRandom.current().nextLong(250);
        return Math.min(MAX_BACKOFF_MS, exponential) + jitter;
    }

    /** Sleeps unless that would pass the deadline; false means give up now. */
    private boolean sleepBeforeRetry(long delayMs, long deadline) {
        if (clock.getAsLong() + delayMs >= deadline) {
            return false;
        }
        try {
            Thread.sleep(delayMs);
            return true;
        } catch (InterruptedException ex) {
            Thread.currentThread().interrupt();
            return false;
        }
    }

    private static long parseRetryAfterSeconds(String value) {
        try {
            return Long.parseLong(value.trim()) * 1000;
        } catch (NumberFormatException ex) {
            return -1;
        }
    }

    private static String oneLine(String value) {
        if (value == null) {
            return "";
        }
        return value.replaceAll("[\\r\\n|\"]+", " ").trim();
    }
}
