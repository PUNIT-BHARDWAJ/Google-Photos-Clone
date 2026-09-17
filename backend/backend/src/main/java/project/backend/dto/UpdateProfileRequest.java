package project.backend.dto;

import jakarta.validation.constraints.Size;

public record UpdateProfileRequest(
        @Size(min = 1, max = 100, message = "Display name must be between 1 and 100 characters") String displayName,
        @Size(min = 8, max = 100, message = "Password must be at least 8 characters") String currentPassword,
        @Size(min = 8, max = 100, message = "Password must be at least 8 characters") String newPassword
) {
}
