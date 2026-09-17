package project.backend.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;

public record CreateSharedLinkRequest(
        @Min(1) @Max(365) Integer expiryDays
) {
}
