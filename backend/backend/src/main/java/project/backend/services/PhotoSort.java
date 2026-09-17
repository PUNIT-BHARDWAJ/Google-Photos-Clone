package project.backend.services;

import java.util.Arrays;
import java.util.Locale;

/**
 * Timeline orderings. "Taken" is the capture date, falling back to the upload
 * date for photos without EXIF - the same date the grid groups days by.
 */
public enum PhotoSort {
    TAKEN_DESC("taken_desc"),
    TAKEN_ASC("taken_asc"),
    ADDED_DESC("added_desc"),
    ADDED_ASC("added_asc");

    private final String param;

    PhotoSort(String param) {
        this.param = param;
    }

    public String param() {
        return param;
    }

    public boolean ascending() {
        return this == TAKEN_ASC || this == ADDED_ASC;
    }

    public boolean byUploadDate() {
        return this == ADDED_DESC || this == ADDED_ASC;
    }

    /** Unknown or missing values fall back to newest taken first rather than failing the request. */
    public static PhotoSort fromParam(String value) {
        if (value == null || value.isBlank()) {
            return TAKEN_DESC;
        }
        String normalized = value.trim().toLowerCase(Locale.ROOT);
        return Arrays.stream(values())
                .filter(sort -> sort.param.equals(normalized) || sort.name().equalsIgnoreCase(normalized))
                .findFirst()
                .orElse(TAKEN_DESC);
    }
}
