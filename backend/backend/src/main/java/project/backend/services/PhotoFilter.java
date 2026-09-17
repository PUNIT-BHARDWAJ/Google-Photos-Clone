package project.backend.services;

import java.time.Instant;
import java.util.List;
import java.util.Locale;
import java.util.Objects;

import project.backend.domain.PhotoStatus;

/**
 * Everything that narrows a photo list besides a search query: quick filter
 * chips (favorites, recent, scene) and the advanced search panel (dates,
 * scene, color, tags). Values are normalized here so the query layer can
 * compare them directly.
 *
 * @param from       photo date (capture, else upload) on or after this instant
 * @param to         photo date before this instant
 * @param addedAfter uploaded on or after this instant ("Recent")
 */
public record PhotoFilter(
        PhotoStatus status,
        Boolean starred,
        String scene,
        String color,
        List<String> tags,
        Instant from,
        Instant to,
        Instant addedAfter,
        PhotoSort sort
) {
    public PhotoFilter {
        status = status == null ? PhotoStatus.ACTIVE : status;
        scene = normalize(scene);
        color = normalize(color);
        tags = tags == null ? List.of() : tags.stream()
                .map(PhotoFilter::normalize)
                .filter(Objects::nonNull)
                .distinct()
                .limit(10)
                .toList();
        sort = sort == null ? PhotoSort.TAKEN_DESC : sort;
    }

    public static PhotoFilter of(PhotoStatus status) {
        return new PhotoFilter(status, null, null, null, List.of(), null, null, null, null);
    }

    /** True when something other than status and sort narrows the results. */
    public boolean hasConstraints() {
        return starred != null || scene != null || color != null || !tags.isEmpty()
                || from != null || to != null || addedAfter != null;
    }

    private static String normalize(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return TagVocabulary.normalizeSpelling(value.trim().toLowerCase(Locale.ROOT));
    }
}
