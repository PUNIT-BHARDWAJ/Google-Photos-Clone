package project.backend.dto;

import java.time.Instant;

// Deliberately minimal - no photo id, no user info, and NEVER GPS coordinates
// (latitude/longitude). Anything added here is visible to anyone with the
// link, logged in or not.
public record PublicPhotoResponse(
        String fileName,
        String url,
        String thumbnailUrl,
        String mimeType,
        Integer width,
        Integer height,
        Instant dateTaken,
        String cameraMake,
        String cameraModel
) {
}
