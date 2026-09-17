package project.backend.dto;

import java.util.List;

/**
 * Gemini's answer to an edit instruction: a sentence for the user plus the
 * operation keys (from ImageEditMapper's vocabulary) that would achieve it.
 */
public record EditSuggestion(
        String suggestion,
        List<String> operations
) {
}
