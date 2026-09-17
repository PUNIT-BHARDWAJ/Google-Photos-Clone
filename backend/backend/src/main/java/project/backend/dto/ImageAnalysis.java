package project.backend.dto;

import java.util.List;

/** Gemini's reading of one photo, already normalized (see GeminiResponseParser). */
public record ImageAnalysis(
        String caption,
        List<String> tags,
        String sceneType,
        List<String> dominantColors
) {
}
