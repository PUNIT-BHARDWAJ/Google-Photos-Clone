package project.backend.services;

import java.io.IOException;
import java.time.Instant;
import java.util.List;
import java.util.Set;
import java.util.UUID;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import io.imagekit.models.files.FileUploadResponse;
import project.backend.domain.AiTransformType;
import project.backend.domain.Photo;
import project.backend.domain.PhotoMetadata;
import project.backend.domain.PhotoStatus;
import project.backend.domain.User;
import project.backend.dto.CreatePhotoRequest;
import project.backend.dto.PageResponse;
import project.backend.dto.PhotoMetadataResponse;
import project.backend.dto.PhotoResponse;
import project.backend.domain.Album;
import project.backend.exception.BadRequestException;
import project.backend.exception.ResourceConflictException;
import project.backend.exception.ResourceNotFoundException;
import project.backend.repository.AlbumPhotoRepository;
import project.backend.repository.AlbumRepository;
import project.backend.repository.PhotoRepository;
import project.backend.repository.SharedLinkRepository;

@Service
public class PhotoService {
    private static final Logger log = LoggerFactory.getLogger(PhotoService.class);

    private static final Set<String> ALLOWED_CONTENT_TYPES = Set.of(
            "image/jpeg",
            "image/png",
            "image/gif",
            "image/webp",
            "image/heic",
            "image/heif",
            "image/bmp",
            "image/tiff",
            "image/svg+xml");

    private static final Set<String> ALLOWED_EXTENSIONS = Set.of(
            "jpg", "jpeg", "png", "gif", "webp", "heic", "heif", "bmp", "tiff", "tif", "svg");

    private final PhotoRepository photoRepository;
    private final ImageKitService imageKitService;
    private final AlbumRepository albumRepository;
    private final AlbumPhotoRepository albumPhotoRepository;
    private final SharedLinkRepository sharedLinkRepository;
    private final MetadataExtractionService metadataExtractionService;
    private final ApplicationEventPublisher eventPublisher;
    private final AiQueueTracker aiQueueTracker;

    public PhotoService(
            PhotoRepository photoRepository,
            ImageKitService imageKitService,
            AlbumRepository albumRepository,
            AlbumPhotoRepository albumPhotoRepository,
            SharedLinkRepository sharedLinkRepository,
            MetadataExtractionService metadataExtractionService,
            ApplicationEventPublisher eventPublisher,
            AiQueueTracker aiQueueTracker
    ) {
        this.photoRepository = photoRepository;
        this.imageKitService = imageKitService;
        this.albumRepository = albumRepository;
        this.albumPhotoRepository = albumPhotoRepository;
        this.sharedLinkRepository = sharedLinkRepository;
        this.metadataExtractionService = metadataExtractionService;
        this.eventPublisher = eventPublisher;
        this.aiQueueTracker = aiQueueTracker;
    }

    @Transactional(readOnly = true)
    public PageResponse<PhotoResponse> listPhotos(User user, PhotoStatus status, Boolean starred, Pageable pageable) {
        Page<Photo> page = starred == null
                ? photoRepository.findTimeline(user.getId(), status, pageable)
                : photoRepository.findTimelineByStarred(user.getId(), status, starred, pageable);
        return toPageResponse(page);
    }

    @Transactional(readOnly = true)
    public PhotoResponse getPhoto(User user, UUID photoId) {
        Photo photo = photoRepository.findByIdAndUserId(photoId, user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Photo not found"));
        return toPhotoResponse(photo);
    }

    @Transactional(readOnly = true)
    public PhotoMetadataResponse getPhotoMetadata(User user, UUID photoId) {
        Photo photo = photoRepository.findByIdAndUserId(photoId, user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Photo not found"));
        PhotoMetadata metadata = photo.getMetadata() != null ? photo.getMetadata() : PhotoMetadata.builder().build();

        return new PhotoMetadataResponse(
                photo.getId(),
                metadata.getDateTaken(),
                metadata.getCameraMake(),
                metadata.getCameraModel(),
                metadata.getFocalLength(),
                metadata.getAperture(),
                metadata.getIso(),
                metadata.getShutterSpeed(),
                metadata.getImageWidth(),
                metadata.getImageHeight(),
                metadata.getLatitude(),
                metadata.getLongitude(),
                metadata.getFileSize()
        );
    }

    @Transactional
    public PhotoResponse toggleStar(User user, UUID photoId) {
        Photo photo = photoRepository.findByIdAndUserId(photoId, user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Photo not found"));
        photo.setStarred(!photo.isStarred());
        return toPhotoResponse(photoRepository.save(photo));
    }

    @Transactional
    public PhotoResponse createDerivedPhoto(
            User user,
            Photo sourcePhoto,
            FileUploadResponse uploadResponse,
            AiTransformType transformType,
            String displayFileName
    ) {
        String fileId = uploadResponse.fileId() 
        .orElseThrow(() -> new BadRequestException("ImageKit  did not return a file id"));
        String url = uploadResponse.url()
        .orElseThrow(() -> new BadRequestException("ImageKit  did not return a file url"));

        String thumbnailUrl = uploadResponse.thumbnailUrl()
        .orElse(imageKitService.buildThumbnailUrlFromUrl(url));

        Photo photo =Photo.builder()
                    .user(user)
                    .imageKitFileId(fileId)
                    .fileName(uploadResponse.name().orElse(sourcePhoto.getFileName()))
                    .originalFileName(displayFileName)
                    .url(url)
                    .thumbnailUrl(thumbnailUrl)
                    .mimeType(uploadResponse.fileType().orElse(sourcePhoto.getMimeType()))
                    .sizeBytes(uploadResponse.size().map(Double::longValue).orElse(0L))
                    .width(uploadResponse.width().map(Double::intValue).orElse(sourcePhoto.getWidth()))
                    .height(uploadResponse.height().map(Double::intValue).orElse(sourcePhoto.getHeight()))
                    .status(PhotoStatus.ACTIVE)
                    .parentPhotoId(sourcePhoto.getId())
                    .aiTransformType(transformType)
                    .build();
            return toPhotoResponse(photoRepository.save(photo));
        }  

    @Transactional
    public PhotoResponse uploadPhoto(User user, MultipartFile file) {
         validateUpload(file);

        // Buffered once up front: the bytes are read here for EXIF extraction
        // and separately handed to ImageKit below via the original MultipartFile,
        // so neither read can exhaust a stream the other one still needs.
        PhotoMetadata metadata = extractMetadataSafely(file);

       FileUploadResponse uploadResponse = imageKitService.uploadPhoto(user, file);

        String fileId = uploadResponse.fileId()
           .orElseThrow(() -> new BadRequestException("ImageKit did not return a file id"));
        String url = uploadResponse.url()
            .orElseThrow(() -> new BadRequestException("ImageKit did not return a file url"));
        String filePath = uploadResponse.filePath().orElse(null);

        // ImageKit doesn't always report dimensions (varies by format); the
        // metadata extracted above (EXIF, falling back to ImageIO pixel read)
        // covers most of the gap, so every photo the frontend's justified
        // grid sees has real dimensions instead of falling back to a guess.
        CreatePhotoRequest request = new CreatePhotoRequest(
                fileId,
                uploadResponse.name().orElse(file.getOriginalFilename()),
                url,
                uploadResponse.thumbnailUrl().orElse(null),
                file.getContentType(),
                uploadResponse.size().map(Double::longValue).orElse(file.getSize()),
                uploadResponse.width().map(Double::intValue).orElse(metadata.getImageWidth()),
                uploadResponse.height().map(Double::intValue).orElse(metadata.getImageHeight())
        );

        PhotoResponse photo = createPhoto(user, request, file.getOriginalFilename());
        // Handled after this transaction commits, on a background thread - the
        // upload response never waits for AI analysis.
        eventPublisher.publishEvent(new PhotoUploadedEvent(photo.id()));

        boolean needsThumbnailBackfill = filePath != null
                && (photo.thumbnailUrl() == null || photo.thumbnailUrl().isBlank());
        if (needsThumbnailBackfill || metadata.hasAnyValue()) {
            Photo savedPhoto = photoRepository.findById(photo.id())
                    .orElseThrow(() -> new ResourceNotFoundException("Photo not found"));
            if (needsThumbnailBackfill) {
                savedPhoto.setThumbnailUrl(imageKitService.buildThumbnailUrl(filePath));
            }
            savedPhoto.setMetadata(metadata);
            return toPhotoResponse(photoRepository.save(savedPhoto));
        }

        return photo;
    }

    private PhotoMetadata extractMetadataSafely(MultipartFile file) {
        try {
            byte[] bytes = file.getBytes();
            PhotoMetadata metadata = metadataExtractionService.extractMetadata(bytes);
            metadata.setFileSize((long) bytes.length);
            return metadata;
        } catch (IOException e) {
            return PhotoMetadata.builder().build();
        }
    }

   @Transactional
    public PhotoResponse createPhoto(User user, CreatePhotoRequest request) {
        return createPhoto(user, request, null);
    }

    private PhotoResponse createPhoto(User user, CreatePhotoRequest request, String originalFileName) {
        if (photoRepository.existsByImageKitFileIdAndUserId(request.imageKitFileId(),user.getId())) {
            throw new ResourceConflictException("Photo already exists in your library");
        }

        String thumbnailUrl = request.thumbnailUrl();
        if (thumbnailUrl == null || thumbnailUrl.isBlank()) {
            thumbnailUrl = imageKitService.buildThumbnailUrlFromUrl(request.url());
        }

        Photo photo = Photo.builder()
                .user(user)
                .imageKitFileId(request.imageKitFileId())
                .fileName(request.fileName())
                .originalFileName(originalFileName)
                .url(request.url())
                .thumbnailUrl(request.thumbnailUrl())
                .mimeType(request.mimeType())
                .sizeBytes(request.sizeBytes())
                .width(request.width())
                .height(request.height())
                .status(PhotoStatus.ACTIVE)
                .build();
                
        return toPhotoResponse(photoRepository.save(photo));
    }

    @Transactional
    public void archivePhotos(User user, List<UUID> photoIds) {
        updatePhotoStatus(user, photoIds, PhotoStatus.ACTIVE, PhotoStatus.ARCHIVE, false);
    }

    @Transactional
    public void movePhotosToTrash(User user, List<UUID> photoIds) {
        List<Photo> photos = loadOwnedPhotos(user, photoIds);
       
        for (Photo photo : photos) {
            if (photo.getStatus() == PhotoStatus.TRASH) {
                continue;
            }
            photo.setStatus(PhotoStatus.TRASH);
            photo.setDeletedAt(Instant.now());;
        }
    }

    @Transactional
    public void restorePhotos(User user, List<UUID> photoIds) {
        List<Photo> photos = photoRepository.findByIdInAndUserId(photoIds, user.getId());
        if (photos.size() != photoIds.size()) {
            throw new ResourceNotFoundException("One or more photos were not found");
        }

        for (Photo photo : photos) {
            if (photo.getStatus() == PhotoStatus.ACTIVE) { 
                continue;
            }
            photo.setStatus(PhotoStatus.ACTIVE);
            photo.setDeletedAt(null);
        }
    }

    @Transactional
    public void permanentlyDeletePhotos(User user, List<UUID> photoIds) {
        List<Photo> photos = photoRepository.findByIdInAndUserId(photoIds, user.getId());
        if (photos.size() != photoIds.size()) {
            throw new ResourceNotFoundException("One or more photos were not found");
        }

        for (Photo photo : photos) {
            if (photo.getStatus() != PhotoStatus.TRASH) {
                throw new BadRequestException("Only photos in trash can be permanently deleted");
            }

            List<Album> coverAlbums = albumRepository.findByCoverPhotoId(photo.getId());
            for (Album album : coverAlbums) {
                album.setCoverPhoto(null);
            }
            albumRepository.saveAll(coverAlbums);

            albumPhotoRepository.deleteAll(albumPhotoRepository.findByPhotoId(photo.getId()));
            sharedLinkRepository.deleteByPhotoId(photo.getId());

            imageKitService.deleteFile(photo.getImageKitFileId());
            photoRepository.delete(photo);
        }
    }

    @Transactional 
    public void permanentlyDeletePhoto(User user, UUID photoId) {
        permanentlyDeletePhotos(user, List.of(photoId));
    }

    
    private void updatePhotoStatus(
            User user,
            List<UUID> photoIds,
            PhotoStatus requiredCurrentStatus,
            PhotoStatus newStatus,
            boolean setDeletedAt
    ) {
        List<Photo> photos = loadOwnedPhotos(user, photoIds);
        for (Photo photo : photos) {
            if (photo.getStatus() == requiredCurrentStatus) {
                photo.setStatus(newStatus);
                if (setDeletedAt) {
                    photo.setDeletedAt(Instant.now());
                } else {
                    photo.setDeletedAt(null);
                }
            }
        }
    }
    private List<Photo> loadOwnedPhotos(User user, List<UUID> photoIds) {
        List<Photo> photos = photoRepository.findByIdInAndUserId(photoIds, user.getId());
        if (photos.size() != photoIds.size()) {
            throw new ResourceNotFoundException("One or more photos were not found");
        }
        return photos;
    }
    private void validateUpload(MultipartFile file) {
        if (file.isEmpty()) {
            throw new BadRequestException("File is empty");
        }

        String contentType = file.getContentType();
        if (contentType != null && ALLOWED_CONTENT_TYPES.contains(contentType.toLowerCase())) {
            return;
        }

        // Browsers/OSes are inconsistent about Content-Type for drag-and-drop
        // uploads and HEIC in particular (often arrives as null or the generic
        // application/octet-stream) - fall back to the file extension rather
        // than rejecting a real photo outright. Only reject when BOTH signals
        // are unrecognized.
        boolean genericOrMissingType = contentType == null
                || contentType.isBlank()
                || "application/octet-stream".equalsIgnoreCase(contentType);
        if (genericOrMissingType) {
            String extension = extractExtension(file.getOriginalFilename());
            if (extension != null && ALLOWED_EXTENSIONS.contains(extension)) {
                return;
            }
        }

        log.warn("Upload rejected - filename: {}, contentType: {}, size: {}",
                file.getOriginalFilename(), contentType, file.getSize());
        throw new BadRequestException(
                "Unsupported file type: " + contentType
                        + ". Accepted types: JPEG, PNG, GIF, WebP, HEIC, BMP, TIFF, SVG");
    }

    private String extractExtension(String filename) {
        if (filename == null) {
            return null;
        }
        int dotIndex = filename.lastIndexOf('.');
        if (dotIndex < 0 || dotIndex == filename.length() - 1) {
            return null;
        }
        return filename.substring(dotIndex + 1).toLowerCase();
    }

    

    private PageResponse<PhotoResponse> toPageResponse(Page<Photo> page) {
        List<PhotoResponse> content = page.getContent().stream()
                .map(this::toPhotoResponse)
                .toList();
        return new PageResponse<>(
                content,
                page.getNumber(),
                page.getSize(),
                page.getTotalElements(),
                page.getTotalPages(),
                page.isLast()
        );
    }

    public PhotoResponse toPhotoResponse(Photo photo) {
        PhotoMetadata metadata = photo.getMetadata();
        return new PhotoResponse(
                photo.getId(),
                photo.getImageKitFileId(),
                photo.getDisplayFileName(),
                photo.getUrl(),
                photo.getThumbnailUrl(),
                photo.getMimeType(),
                photo.getSizeBytes(),
                photo.getWidth(),
                photo.getHeight(),
                photo.getStatus(),
                photo.getCreatedAt(),
                photo.getDeletedAt(),
                photo.getParentPhotoId(),
                photo.getAiTransformType(),
                photo.isStarred(),
                metadata != null ? metadata.getDateTaken() : null,
                metadata != null && metadata.hasCameraData(),
                metadata != null && metadata.hasGpsData(),
                photo.getAiCaption(),
                photo.getAiTagList(),
                photo.getAiSceneType(),
                photo.getAiDominantColorList(),
                photo.getAiProcessedAt(),
                photo.getAiError(),
                aiQueueTracker.isPending(photo.getId())
        );
    }
}