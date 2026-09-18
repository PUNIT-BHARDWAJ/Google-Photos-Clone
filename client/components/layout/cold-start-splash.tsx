"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { getApiActivity, getServerApiActivity, subscribeApiActivity } from "@/lib/api-activity";

// The API is hosted on a plan that sleeps when idle; waking it takes about
// half a minute. Below ten seconds that's indistinguishable from an ordinary
// slow request, so nothing is said at all.
const SPLASH_AFTER_MS = 10_000;
const WAKING_AFTER_MS = 30_000;
const SLOW_AFTER_MS = 60_000;
const RETRY_AFTER_MS = 90_000;

function message(elapsed: number) {
  if (elapsed >= SLOW_AFTER_MS) {
    return {
      title: "Still starting up",
      detail: "Longer than usual — the server should be up any moment now.",
    };
  }
  if (elapsed >= WAKING_AFTER_MS) {
    return {
      title: "Waking up the server",
      detail: "The API sleeps when nobody's using it. This usually takes about 30 seconds.",
    };
  }
  return {
    title: "Starting up",
    detail: "First load after a quiet spell takes a moment.",
  };
}

/**
 * A clock that ticks only while a request is outstanding. `now` lives in state
 * and is written from the interval alone - reading Date.now() during render
 * would make the component impure. A `now` left over from before the request
 * started is older than it, so the clamped elapsed time reads 0 until the
 * first tick lands rather than flashing the splash.
 */
function useElapsed(pendingSince: number | null, intervalMs = 500) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (pendingSince === null) return;
    const timer = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(timer);
  }, [pendingSince, intervalMs]);

  return pendingSince === null ? 0 : Math.max(0, now - pendingSince);
}

/**
 * Explains a slow first request instead of leaving a blank screen. It is not
 * an error state: nothing is broken, the server is just getting out of bed.
 */
export function ColdStartSplash() {
  const activity = useSyncExternalStore(subscribeApiActivity, getApiActivity, getServerApiActivity);
  const elapsed = useElapsed(activity.pendingSince);
  const visible = activity.pendingSince !== null && elapsed >= SPLASH_AFTER_MS;
  const { title, detail } = message(elapsed);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="cold-start"
          role="status"
          aria-live="polite"
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center gap-6 bg-background/85 px-6 backdrop-blur-md"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
        >
          <span className="relative flex size-20 items-center justify-center">
            <span
              aria-hidden
              className="absolute inset-0 rounded-full bg-primary/20 motion-safe:animate-ping"
            />
            <span className="relative flex size-16 items-center justify-center rounded-2xl bg-primary/15">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo.svg" alt="" width={36} height={36} />
            </span>
          </span>

          <div className="max-w-sm space-y-1.5 text-center">
            <p className="text-lg font-semibold text-foreground">{title}</p>
            <p className="text-sm text-muted-foreground">{detail}</p>
          </div>

          {elapsed >= RETRY_AFTER_MS && (
            <Button variant="outline" onClick={() => window.location.reload()}>
              Try again
            </Button>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
