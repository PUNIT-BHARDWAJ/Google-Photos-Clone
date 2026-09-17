package project.backend.dto;

import java.time.Instant;

public record AiJobResponse(
        boolean running,
        boolean cancelRequested,
        int total,
        int processed,
        int succeeded,
        int failed,
        Instant startedAt,
        Instant finishedAt,
        String message
) {
}
