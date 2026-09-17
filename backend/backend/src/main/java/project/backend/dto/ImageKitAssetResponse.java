package project.backend.dto;

public record ImageKitAssetResponse(
    String fileId,
    String fileName,
    String url,
    String thumbnailUrl,
    Long sizeBytes,
    Integer width,
    Integer height,
    String mimeType,
    boolean alreadyImported
) {
}
