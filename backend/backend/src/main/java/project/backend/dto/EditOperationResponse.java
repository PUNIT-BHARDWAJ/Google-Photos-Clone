package project.backend.dto;

/** One ImageKit edit step. note explains approximations (e.g. no brightness control). */
public record EditOperationResponse(
        String key,
        String label,
        String note
) {
}
