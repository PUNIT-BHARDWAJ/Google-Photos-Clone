package project.backend.dto;

/**
 * connection: NOT_CONFIGURED, UNKNOWN, CONNECTED, RATE_LIMITED, INVALID_KEY,
 * MODEL_UNAVAILABLE or ERROR.
 */
public record AiStatusResponse(
        boolean configured,
        String connection,
        String connectionMessage,
        String model,
        long totalPhotos,
        long analyzedPhotos,
        long failedPhotos,
        long pendingPhotos,
        AiJobResponse job,
        long secondsPerPhoto,
        long estimatedSecondsRemaining
) {
}
