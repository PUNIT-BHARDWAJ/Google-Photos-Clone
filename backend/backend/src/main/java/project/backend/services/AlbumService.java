package project.backend.services;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import project.backend.domain.AlbumPhoto;
import project.backend.domain.Album;
import project.backend.domain.Photo;
import project.backend.domain.PhotoStatus;
import project.backend.domain.User;
import project.backend.dto.AddPhotosToAlbumReqest;
import project.backend.dto.AlbumResponse;
import project.backend.dto.CreateAlbumRequest;
import project.backend.dto.PageResponse;
import project.backend.dto.PhotoResponse;
import project.backend.dto.UpdateAlbumRequest;
import project.backend.exception.BadRequestException;
import project.backend.exception.ResourceNotFoundException;
import project.backend.repository.AlbumPhotoRepository;
import project.backend.repository.AlbumRepository;
import project.backend.repository.PhotoRepository;
import project.backend.repository.SharedLinkRepository;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
public class AlbumService {

    private final AlbumRepository albumRepository;
    private final AlbumPhotoRepository albumPhotoRepository;
    private final PhotoRepository photoRepository;
    private final PhotoService photoService;
    private final SharedLinkRepository sharedLinkRepository;

    public AlbumService(
            AlbumRepository albumRepository,
            AlbumPhotoRepository albumPhotoRepository,
            PhotoRepository photoRepository,
            PhotoService photoService,
            SharedLinkRepository sharedLinkRepository
    ) {
        this.albumRepository = albumRepository;
        this.albumPhotoRepository = albumPhotoRepository;
        this.photoRepository = photoRepository;
        this.photoService = photoService;
        this.sharedLinkRepository = sharedLinkRepository;
    }

    @Transactional(readOnly = true)
    public List<AlbumResponse> listAlbums(User user) {
        return albumRepository.findByUserIdOrderByUpdatedAtDesc(user.getId()).stream()
                .map(album -> toAlbumResponse(album, albumRepository.countPhotosByAlbumId(album.getId())))
                .toList();
    }

    @Transactional(readOnly = true)
    public AlbumResponse getAlbum(User user, UUID albumId) {
        Album album = getOwnedAlbum(user, albumId);
        return toAlbumResponse(album, albumRepository.countPhotosByAlbumId(album.getId()));
    }

    @Transactional(readOnly = true)
    public PageResponse<PhotoResponse> getPhotosForAlbum(User user, UUID albumId, Pageable pageable) {
        getOwnedAlbum(user, albumId);
        Page<AlbumPhoto> page = albumPhotoRepository.findByAlbumIdAndUserId(albumId, user.getId(), pageable);
        List<PhotoResponse> photos = page.getContent().stream()
                .map(AlbumPhoto::getPhoto)
                .map(photoService::toPhotoResponse)
                .toList();
    
        return new PageResponse<>(
                photos,
                page.getNumber(),
                page.getSize(),
                page.getTotalElements(),
                page.getTotalPages(),
                page.isLast()
        );
    }

    @Transactional
    public AlbumResponse createAlbum(User user, CreateAlbumRequest request) {
        Album album = Album.builder()
                .user(user)
                .title(request.title().trim())
                .build();
        return toAlbumResponse(albumRepository.save(album), 0L);
    }

    @Transactional
    public AlbumResponse updateAlbum(User user, UUID albumId, UpdateAlbumRequest request) {
        Album album = getOwnedAlbum(user, albumId);

        if (request.title() != null && !request.title().isBlank()) {
            album.setTitle(request.title().trim());
        }

        if (request.coverPhotoId() != null) {
            Photo coverPhoto = photoRepository.findByIdAndUserId(request.coverPhotoId(), user.getId())
                    .orElseThrow(() -> new ResourceNotFoundException("Cover photo not found"));
            if (coverPhoto.getStatus() != PhotoStatus.ACTIVE) {
                throw new project.backend.exception.BadRequestException("Cover photo must be active");
            }
            album.setCoverPhoto(coverPhoto);
        }

        return toAlbumResponse(
                albumRepository.save(album),
                albumRepository.countPhotosByAlbumId(album.getId())
        );
    }
    @Transactional
    public void deleteAlbum(User user, UUID albumId) {
        Album album = getOwnedAlbum(user, albumId);
        albumPhotoRepository.deleteAll(albumPhotoRepository.findByAlbumIdAndUserId(albumId, user.getId(), Pageable.unpaged()));
        sharedLinkRepository.deleteByAlbumId(albumId);
        albumRepository.delete(album);
    }
    
    @Transactional
    public void addPhotosToAlbum(User user, UUID albumId, AddPhotosToAlbumReqest request) {
        Album album = getOwnedAlbum(user, albumId);
        List<Photo> photos = photoRepository.findByIdInAndUserId(request.photoIds(), user.getId());

        if (photos.size() != request.photoIds().size()) {
            throw new ResourceNotFoundException("One or more photos are not found");
        }
    
        int sortOrder = albumPhotoRepository.findMaxSortOrder(albumId);
        List<AlbumPhoto> albumPhotos = new ArrayList<>();
    
        for (Photo photo : photos) {
            if (photo.getStatus() != PhotoStatus.ACTIVE) {
                throw new BadRequestException("Only active photos can be added to albums");
            }
            if (albumPhotoRepository.existsByAlbumIdAndPhotoId(albumId, photo.getId())) {
                continue;
            }
            sortOrder++;
            albumPhotos.add(AlbumPhoto.builder()
                    .album(album)
                    .photo(photo)
                    .sortOrder(sortOrder)
                    .build());
            }
    
        albumPhotoRepository.saveAll(albumPhotos);
    
          if(album.getCoverPhoto() == null && !photos.isEmpty()) {
        album.setCoverPhoto(photos.get(0));
        albumRepository.save(album);
    }
          }

    @Transactional
    public void removePhotosFromAlbum(User user, UUID albumId, UUID photoId) {
        getOwnedAlbum(user, albumId);
    if(!albumPhotoRepository.existsByAlbumIdAndPhotoId(albumId,photoId)) {
        throw new ResourceNotFoundException("Photo  not found in album");
    }
        albumPhotoRepository.deleteByAlbumIdAndPhotoId(albumId, photoId);
    }

    private Album getOwnedAlbum(User user, UUID albumId) {
        return albumRepository.findByIdAndUserId(albumId, user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Album not found"));
    }

    private AlbumResponse toAlbumResponse(Album album, long photoCount) {
        Photo coverPhoto = album.getCoverPhoto();
        return new AlbumResponse(
                album.getId(),
                album.getTitle(),
                coverPhoto != null ? coverPhoto.getId() : null,
                coverPhoto != null ? coverPhoto.getThumbnailUrl() : null,
                photoCount,
                album.getCreatedAt(),
                album.getUpdatedAt()
        );
    }
}
