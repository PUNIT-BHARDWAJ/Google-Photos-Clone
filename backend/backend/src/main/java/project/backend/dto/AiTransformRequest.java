package project.backend.dto;

import jakarta.validation.constraints.NotNull;
import project.backend.domain.AiTransformType;

public record AiTransformRequest(
    @NotNull AiTransformType type,
    String prompt,
    Integer width,
    Integer height,
    String focusObject
) {
} 
