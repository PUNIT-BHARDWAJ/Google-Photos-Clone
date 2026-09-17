package project.backend.dto;

public record TagCountResponse(
        String tag,
        long count
) {
}
