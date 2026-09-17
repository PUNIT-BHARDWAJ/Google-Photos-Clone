package project.backend.dto;

import java.util.List;

/**
 * suggestion is Gemini's advice (null when AI is off or failed - aiMessage
 * says why). operations/previewUrl are the ImageKit edits that can be applied;
 * an empty list means nothing in ImageKit's free transforms fits.
 */
public record EditSuggestionResponse(
        String instruction,
        String suggestion,
        boolean aiGenerated,
        String aiMessage,
        List<EditOperationResponse> operations,
        String transformChain,
        String previewUrl
) {
}
