package project.backend.dto;

import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;

/**
 * The one error body every API failure returns - from controller exceptions,
 * Spring Security (401/403) and the servlet /error fallback alike:
 * {@code { "error": "NOT_FOUND", "message": "Photo not found" }}.
 */
public record ApiErrorResponse(String error, String message) {

    public static ApiErrorResponse of(HttpStatusCode status, String message) {
        HttpStatus resolved = HttpStatus.resolve(status.value());
        String error = resolved != null ? resolved.name() : "HTTP_" + status.value();
        return new ApiErrorResponse(error, message);
    }

    /**
     * For writers outside Spring MVC's message converters (security entry
     * points write straight to the servlet response). Both fields are plain
     * strings, so escaping is all the serialization they need.
     */
    public String toJson() {
        return "{\"error\":\"" + escape(error) + "\",\"message\":\"" + escape(message) + "\"}";
    }

    private static String escape(String value) {
        if (value == null) {
            return "";
        }
        StringBuilder out = new StringBuilder(value.length());
        for (char c : value.toCharArray()) {
            switch (c) {
                case '"' -> out.append("\\\"");
                case '\\' -> out.append("\\\\");
                case '\n' -> out.append("\\n");
                case '\r' -> out.append("\\r");
                case '\t' -> out.append("\\t");
                default -> {
                    if (c < 0x20) {
                        out.append(String.format("\\u%04x", (int) c));
                    } else {
                        out.append(c);
                    }
                }
            }
        }
        return out.toString();
    }
}
