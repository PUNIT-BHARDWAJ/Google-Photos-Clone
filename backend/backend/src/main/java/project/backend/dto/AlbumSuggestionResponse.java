package project.backend.dto;

import java.util.List;
import java.util.UUID;

/**
 * id is stable across requests (e.g. "tag:beach") so the client can remember
 * dismissals. kind: SCENE, TAG or DATE.
 */
public record AlbumSuggestionResponse(
        String id,
        String kind,
        String suggestedName,
        List<UUID> photoIds,
        UUID coverPhotoId,
        List<String> previewThumbnailUrls,
        int photoCount,
        String reason
) {
}
