package project.backend.dto;

import java.util.List;

/**
 * A PageResponse plus how the results were ordered: aiRanked is true only when
 * Gemini actually re-ranked them; aiMessage explains why it didn't when asked.
 */
public record PhotoSearchResponse(
        List<PhotoResponse> content,
        int page,
        int size,
        long totalElements,
        int totalPages,
        boolean last,
        boolean aiRanked,
        String aiMessage
) {
}
