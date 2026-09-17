package project.backend.dto;

import java.time.Instant;
import java.util.UUID;

public record PhotoMetadataResponse(
        UUID photoId,
        Instant dateTaken,
        String cameraMake,
        String cameraModel,
        String focalLength,
        String aperture,
        Integer iso,
        String shutterSpeed,
        Integer imageWidth,
        Integer imageHeight,
        Double latitude,
        Double longitude,
        Long fileSize
) {
}
