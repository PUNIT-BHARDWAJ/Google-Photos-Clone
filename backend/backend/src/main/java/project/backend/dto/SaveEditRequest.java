package project.backend.dto;

import java.util.List;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;

public record SaveEditRequest(
        @NotEmpty(message = "Choose at least one edit")
        @Size(max = 10, message = "Too many edits")
        List<String> operations
) {
}
