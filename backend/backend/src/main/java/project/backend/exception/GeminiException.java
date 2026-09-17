package project.backend.exception;

import org.springframework.http.HttpStatus;

/**
 * A Gemini call that didn't produce a usable answer. The message is safe to
 * show users - it never includes the API key or the raw upstream body.
 */
public class GeminiException extends RuntimeException {

    public enum Kind {
        NOT_CONFIGURED(HttpStatus.SERVICE_UNAVAILABLE),
        INVALID_KEY(HttpStatus.SERVICE_UNAVAILABLE),
        MODEL_UNAVAILABLE(HttpStatus.SERVICE_UNAVAILABLE),
        RATE_LIMITED(HttpStatus.TOO_MANY_REQUESTS),
        TIMEOUT(HttpStatus.GATEWAY_TIMEOUT),
        BAD_RESPONSE(HttpStatus.BAD_GATEWAY),
        UPSTREAM_ERROR(HttpStatus.BAD_GATEWAY);

        private final HttpStatus status;

        Kind(HttpStatus status) {
            this.status = status;
        }

        public HttpStatus status() {
            return status;
        }
    }

    private final Kind kind;

    public GeminiException(Kind kind, String message) {
        super(message);
        this.kind = kind;
    }

    public GeminiException(Kind kind, String message, Throwable cause) {
        super(message, cause);
        this.kind = kind;
    }

    public Kind getKind() {
        return kind;
    }

    public static GeminiException notConfigured() {
        return new GeminiException(Kind.NOT_CONFIGURED,
                "AI features are not configured. Add a Gemini API key to enable them.");
    }
}
