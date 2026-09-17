package project.backend.dto;

import java.util.List;
import java.util.UUID;

/** The text-only view of a photo sent to Gemini for search ranking - never the image. */
public record PhotoSummary(
        UUID id,
        String caption,
        List<String> tags,
        String sceneType
) {
}
