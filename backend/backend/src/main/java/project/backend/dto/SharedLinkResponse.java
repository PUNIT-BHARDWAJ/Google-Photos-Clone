package project.backend.dto;

import java.time.Instant;
import java.util.UUID;

public record SharedLinkResponse(
        UUID id,
        String token,
        String url,
        Instant createdAt,
        Instant expiresAt,
        String targetType,
        UUID targetId,
        String targetTitle,
        String targetThumbnailUrl
) {
}
