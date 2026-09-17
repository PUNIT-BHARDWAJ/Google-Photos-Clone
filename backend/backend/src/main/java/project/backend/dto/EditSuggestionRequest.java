package project.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record EditSuggestionRequest(
        @NotBlank(message = "Describe the edit you want")
        @Size(max = 300, message = "Keep the description under 300 characters")
        String instruction
) {
}
