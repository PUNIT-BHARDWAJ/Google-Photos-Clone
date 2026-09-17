package project.backend.services;

import java.time.DateTimeException;
import java.time.ZoneId;
import java.time.ZoneOffset;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import project.backend.domain.Album;
import project.backend.domain.Photo;
import project.backend.domain.PhotoStatus;
import project.backend.domain.User;
import project.backend.dto.AlbumSuggestionResponse;
import project.backend.repository.AlbumPhotoRepository;
import project.backend.repository.AlbumRepository;
import project.backend.repository.PhotoRepository;
import project.backend.services.AlbumSuggestionEngine.PhotoFacts;

@Service
public class AlbumSuggestionService {

    // Suggestions look at the most recent photos only - plenty for grouping,
    // and it bounds the work for very large libraries.
    private static final int MAX_PHOTOS = 2000;

    private final PhotoRepository photoRepository;
    private final AlbumRepository albumRepository;
    private final AlbumPhotoRepository albumPhotoRepository;

    public AlbumSuggestionService(
            PhotoRepository photoRepository,
            AlbumRepository albumRepository,
            AlbumPhotoRepository albumPhotoRepository
    ) {
        this.photoRepository = photoRepository;
        this.albumRepository = albumRepository;
        this.albumPhotoRepository = albumPhotoRepository;
    }

    @Transactional(readOnly = true)
    public List<AlbumSuggestionResponse> suggest(User user, String timeZone) {
        UUID userId = user.getId();
        List<PhotoFacts> photos = photoRepository.findTimeline(userId, PhotoStatus.ACTIVE, PageRequest.of(0, MAX_PHOTOS))
                .getContent().stream()
                .map(AlbumSuggestionService::toFacts)
                .toList();

        List<String> titles = albumRepository.findByUserIdOrderByUpdatedAtDesc(userId).stream()
                .map(Album::getTitle)
                .toList();

        Map<UUID, Set<UUID>> albums = new HashMap<>();
        for (Object[] pair : albumPhotoRepository.findAlbumPhotoPairsByUserId(userId)) {
            albums.computeIfAbsent((UUID) pair[0], key -> new HashSet<>()).add((UUID) pair[1]);
        }

        return AlbumSuggestionEngine.suggest(photos, titles, albums.values(), resolveZone(timeZone)).stream()
                .map(suggestion -> new AlbumSuggestionResponse(
                        suggestion.id(),
                        suggestion.kind(),
                        suggestion.name(),
                        suggestion.photoIds(),
                        suggestion.coverPhotoId(),
                        suggestion.previewThumbnailUrls(),
                        suggestion.photoIds().size(),
                        suggestion.reason()))
                .toList();
    }

    private static PhotoFacts toFacts(Photo photo) {
        var metadata = photo.getMetadata();
        var takenAt = metadata != null && metadata.getDateTaken() != null ? metadata.getDateTaken() : photo.getCreatedAt();
        String thumbnail = photo.getThumbnailUrl() != null && !photo.getThumbnailUrl().isBlank()
                ? photo.getThumbnailUrl()
                : photo.getUrl();
        return new PhotoFacts(photo.getId(), thumbnail, photo.getAiSceneType(), photo.getAiTagList(), takenAt, photo.isStarred());
    }

    private static ZoneId resolveZone(String timeZone) {
        if (timeZone == null || timeZone.isBlank()) {
            return ZoneOffset.UTC;
        }
        try {
            return ZoneId.of(timeZone.trim());
        } catch (DateTimeException ex) {
            return ZoneOffset.UTC;
        }
    }
}
