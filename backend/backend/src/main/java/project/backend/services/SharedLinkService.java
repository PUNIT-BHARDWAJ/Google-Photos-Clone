package project.backend.services;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import project.backend.config.AppUrlProperties;
import project.backend.domain.Album;
import project.backend.domain.AlbumPhoto;
import project.backend.domain.Photo;
import project.backend.domain.PhotoStatus;
import project.backend.domain.SharedLink;
import project.backend.domain.User;
import project.backend.dto.PublicAlbumResponse;
import project.backend.dto.PublicPhotoResponse;
import project.backend.dto.SharedLinkResponse;
import project.backend.exception.BadRequestException;
import project.backend.exception.ResourceGoneException;
import project.backend.exception.ResourceNotFoundException;
import project.backend.repository.AlbumPhotoRepository;
import project.backend.repository.AlbumRepository;
import project.backend.repository.PhotoRepository;
import project.backend.repository.SharedLinkRepository;

@Service
public class SharedLinkService {

    private final SharedLinkRepository sharedLinkRepository;
    private final PhotoRepository photoRepository;
    private final AlbumRepository albumRepository;
    private final AlbumPhotoRepository albumPhotoRepository;
    private final AppUrlProperties appUrlProperties;

    public SharedLinkService(
            SharedLinkRepository sharedLinkRepository,
            PhotoRepository photoRepository,
            AlbumRepository albumRepository,
            AlbumPhotoRepository albumPhotoRepository,
            AppUrlProperties appUrlProperties
    ) {
        this.sharedLinkRepository = sharedLinkRepository;
        this.photoRepository = photoRepository;
        this.albumRepository = albumRepository;
        this.albumPhotoRepository = albumPhotoRepository;
        this.appUrlProperties = appUrlProperties;
    }

    @Transactional
    public SharedLinkResponse createPhotoLink(User user, UUID photoId, Integer expiryDays) {
        Photo photo = photoRepository.findByIdAndUserId(photoId, user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Photo not found"));
        if (photo.getStatus() != PhotoStatus.ACTIVE) {
            throw new BadRequestException("Only active photos can be shared");
        }

        SharedLink link = sharedLinkRepository.findByPhotoIdAndUserId(photoId, user.getId())
                .orElseGet(() -> sharedLinkRepository.save(
                        SharedLink.builder()
                                .token(UUID.randomUUID().toString())
                                .photo(photo)
                                .user(user)
                                .expiresAt(expiryFromDays(expiryDays))
                                .build()
                ));

        return toResponse(link);
    }

    @Transactional
    public SharedLinkResponse createAlbumLink(User user, UUID albumId, Integer expiryDays) {
        Album album = albumRepository.findByIdAndUserId(albumId, user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Album not found"));

        SharedLink link = sharedLinkRepository.findByAlbumIdAndUserId(albumId, user.getId())
                .orElseGet(() -> sharedLinkRepository.save(
                        SharedLink.builder()
                                .token(UUID.randomUUID().toString())
                                .album(album)
                                .user(user)
                                .expiresAt(expiryFromDays(expiryDays))
                                .build()
                ));

        return toResponse(link);
    }

    @Transactional(readOnly = true)
    public PublicPhotoResponse getSharedPhoto(String token) {
        SharedLink link = getValidLink(token);
        Photo photo = link.getPhoto();
        if (photo == null) {
            throw new ResourceNotFoundException("Link not found");
        }
        return toPublicPhotoResponse(photo);
    }

    @Transactional(readOnly = true)
    public PublicAlbumResponse getSharedAlbum(String token) {
        SharedLink link = getValidLink(token);
        Album album = link.getAlbum();
        if (album == null) {
            throw new ResourceNotFoundException("Link not found");
        }

        List<PublicPhotoResponse> photos = albumPhotoRepository.findByAlbumIdOrderBySortOrder(album.getId())
                .stream()
                .map(AlbumPhoto::getPhoto)
                .map(this::toPublicPhotoResponse)
                .toList();

        return new PublicAlbumResponse(album.getTitle(), photos);
    }

    @Transactional
    public void revokeLink(User user, UUID linkId) {
        SharedLink link = sharedLinkRepository.findById(linkId)
                .filter(existing -> existing.getUser().getId().equals(user.getId()))
                .orElseThrow(() -> new ResourceNotFoundException("Shared link not found"));
        sharedLinkRepository.delete(link);
    }

    @Transactional(readOnly = true)
    public List<SharedLinkResponse> getUserLinks(User user) {
        Instant now = Instant.now();
        return sharedLinkRepository.findByUserId(user.getId()).stream()
                .filter(link -> link.getExpiresAt() == null || link.getExpiresAt().isAfter(now))
                .map(this::toResponse)
                .toList();
    }

    private SharedLink getValidLink(String token) {
        SharedLink link = sharedLinkRepository.findByToken(token)
                .orElseThrow(() -> new ResourceNotFoundException("Link not found"));
        if (link.getExpiresAt() != null && link.getExpiresAt().isBefore(Instant.now())) {
            throw new ResourceGoneException("This link has expired");
        }
        return link;
    }

    private Instant expiryFromDays(Integer expiryDays) {
        return expiryDays != null ? Instant.now().plus(expiryDays, ChronoUnit.DAYS) : null;
    }

    private PublicPhotoResponse toPublicPhotoResponse(Photo photo) {
        return new PublicPhotoResponse(
                photo.getDisplayFileName(),
                photo.getUrl(),
                photo.getThumbnailUrl(),
                photo.getMimeType(),
                photo.getWidth(),
                photo.getHeight(),
                photo.getMetadata() != null ? photo.getMetadata().getDateTaken() : null,
                photo.getMetadata() != null ? photo.getMetadata().getCameraMake() : null,
                photo.getMetadata() != null ? photo.getMetadata().getCameraModel() : null
        );
    }

    private SharedLinkResponse toResponse(SharedLink link) {
        String targetType;
        UUID targetId;
        String title;
        String thumbnailUrl;

        if (link.getPhoto() != null) {
            targetType = "PHOTO";
            targetId = link.getPhoto().getId();
            title = link.getPhoto().getDisplayFileName();
            thumbnailUrl = link.getPhoto().getThumbnailUrl();
        } else {
            targetType = "ALBUM";
            targetId = link.getAlbum().getId();
            title = link.getAlbum().getTitle();
            Photo cover = link.getAlbum().getCoverPhoto();
            thumbnailUrl = cover != null ? cover.getThumbnailUrl() : null;
        }

        return new SharedLinkResponse(
                link.getId(),
                link.getToken(),
                appUrlProperties.frontendUrl() + "/shared/" + link.getToken(),
                link.getCreatedAt(),
                link.getExpiresAt(),
                targetType,
                targetId,
                title,
                thumbnailUrl
        );
    }
}
