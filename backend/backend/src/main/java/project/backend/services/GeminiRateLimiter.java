package project.backend.services;

import java.util.ArrayDeque;
import java.util.Deque;
import java.util.function.LongSupplier;

/**
 * Sliding one-minute window shared by every Gemini call, so uploads, bulk
 * analysis, search and edit suggestions together stay under the free tier's
 * requests-per-minute limit. A 429 can also pause everyone until Gemini's
 * suggested retry time.
 */
public class GeminiRateLimiter {

    private static final long WINDOW_MS = 60_000;
    private static final long MAX_SLEEP_MS = 1_000;

    private final int permitsPerMinute;
    private final LongSupplier clock;
    private final Deque<Long> grants = new ArrayDeque<>();
    private long pausedUntil;

    public GeminiRateLimiter(int permitsPerMinute, LongSupplier clock) {
        this.permitsPerMinute = Math.max(1, permitsPerMinute);
        this.clock = clock;
    }

    /**
     * Waits for a permit until {@code deadlineMillis} (clock time). Returns
     * false - without taking a permit - if one wouldn't be free by then.
     */
    public boolean acquire(long deadlineMillis) throws InterruptedException {
        while (true) {
            long waitMs = tryReserve();
            if (waitMs == 0) {
                return true;
            }
            long now = clock.getAsLong();
            if (now + waitMs > deadlineMillis) {
                return false;
            }
            // Short naps: another caller's pause or a freed slot can change
            // the answer while this thread sleeps.
            Thread.sleep(Math.min(waitMs, MAX_SLEEP_MS));
        }
    }

    /** Takes a permit and returns 0, or returns how long until one might be free. */
    synchronized long tryReserve() {
        long now = clock.getAsLong();
        while (!grants.isEmpty() && grants.peekFirst() <= now - WINDOW_MS) {
            grants.pollFirst();
        }

        long freeAt = now;
        if (pausedUntil > freeAt) {
            freeAt = pausedUntil;
        }
        if (grants.size() >= permitsPerMinute) {
            freeAt = Math.max(freeAt, grants.peekFirst() + WINDOW_MS);
        }
        if (freeAt > now) {
            return freeAt - now;
        }
        grants.addLast(now);
        return 0;
    }

    public synchronized void pauseUntil(long untilMillis) {
        pausedUntil = Math.max(pausedUntil, untilMillis);
    }

    public synchronized boolean isPaused() {
        return pausedUntil > clock.getAsLong();
    }
}
