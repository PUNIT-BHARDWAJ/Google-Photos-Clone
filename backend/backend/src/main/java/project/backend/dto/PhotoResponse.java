package project.backend.dto;

import java.time.Instant;
import java.util.UUID;

import project.backend.domain.AiTransformType;
import project.backend.domain.PhotoStatus;

public record PhotoResponse(
    UUID id,
    String imageKitFileId,
    String fileName,
    String url,
    String thumbnailUrl,
    String mimeType,
    Long sizeBytes,
    Integer width,
    Integer height,
    PhotoStatus status,
    Instant createdAt,
    Instant deletedAt,
    UUID parentPhotoId,
    AiTransformType aiTransformType,
    boolean starred,
    Instant dateTaken,
    boolean hasCameraData,
    boolean hasGpsData
)
 {

}