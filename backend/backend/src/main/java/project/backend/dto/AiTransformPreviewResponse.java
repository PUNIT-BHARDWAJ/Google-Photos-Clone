package project.backend.dto;

import project.backend.domain.AiTransformType;

public record AiTransformPreviewResponse(
    String previewUrl,
    AiTransformType type,
    String transformChain
) {
} 