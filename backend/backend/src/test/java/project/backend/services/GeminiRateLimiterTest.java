package project.backend.services;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.concurrent.atomic.AtomicLong;

import org.junit.jupiter.api.Test;

class GeminiRateLimiterTest {

    private final AtomicLong now = new AtomicLong(1_000_000);
    private final GeminiRateLimiter limiter = new GeminiRateLimiter(3, now::get);

    @Test
    void allowsTheConfiguredNumberOfRequestsPerMinute() {
        assertThat(limiter.tryReserve()).isZero();
        now.addAndGet(10_000);
        assertThat(limiter.tryReserve()).isZero();
        assertThat(limiter.tryReserve()).isZero();

        // The first grant frees up 60s after it was taken, 50s from now.
        assertThat(limiter.tryReserve()).isEqualTo(50_000);

        now.addAndGet(50_000);
        assertThat(limiter.tryReserve()).isZero();
    }

    @Test
    void aPauseBlocksEveryoneUntilItEnds() {
        limiter.pauseUntil(now.get() + 5_000);

        assertThat(limiter.isPaused()).isTrue();
        assertThat(limiter.tryReserve()).isEqualTo(5_000);

        now.addAndGet(5_000);
        assertThat(limiter.isPaused()).isFalse();
        assertThat(limiter.tryReserve()).isZero();
    }

    @Test
    void acquireGivesUpWhenNoPermitArrivesBeforeTheDeadline() throws InterruptedException {
        limiter.tryReserve();
        limiter.tryReserve();
        limiter.tryReserve();

        assertThat(limiter.acquire(now.get() + 1_000)).isFalse();
    }
}
