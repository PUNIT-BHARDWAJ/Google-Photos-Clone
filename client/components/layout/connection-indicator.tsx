"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { getApiActivity, getServerApiActivity, subscribeApiActivity } from "@/lib/api-activity";
import { cn } from "@/lib/utils";

// Below this a request is just a request; above it the server is probably
// waking up and the dot should say so.
const CONNECTING_AFTER_MS = 3_000;

type State = "connected" | "connecting" | "offline";

const LABELS: Record<State, string> = {
  connected: "Connected",
  connecting: "Connecting…",
  offline: "Offline",
};

const DOT_CLASSES: Record<State, string> = {
  connected: "bg-emerald-500",
  connecting: "bg-amber-500",
  offline: "bg-destructive",
};

/**
 * A quiet dot in the corner: green once the API has answered, amber while a
 * request is taking long enough to notice, red when the server can't be
 * reached. Only the last two carry a label - a healthy app shouldn't spend
 * screen space telling you it's healthy.
 */
export function ConnectionIndicator() {
  const activity = useSyncExternalStore(subscribeApiActivity, getApiActivity, getServerApiActivity);
  // `now` is only ever written from the timer: reading the clock during render
  // would make this component impure. A stale value simply reads as "not slow
  // yet" until the timer fires.
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (activity.pendingSince === null) return;
    const remaining = Math.max(0, CONNECTING_AFTER_MS - (Date.now() - activity.pendingSince));
    const timer = setTimeout(() => setNow(Date.now()), remaining + 50);
    return () => clearTimeout(timer);
  }, [activity.pendingSince]);

  const slow = activity.pendingSince !== null && now - activity.pendingSince >= CONNECTING_AFTER_MS;

  // Nothing has been asked of the API yet - there's nothing to report.
  if (activity.status === "unknown" && !slow) return null;

  const state: State = slow ? "connecting" : activity.status === "offline" ? "offline" : "connected";
  const label = LABELS[state];
  const expanded = state !== "connected";

  return (
    <div className="pointer-events-none fixed bottom-4 left-4 z-50 hidden md:block">
      <motion.div
        layout
        className={cn(
          "flex items-center gap-2 rounded-full border border-border/60 py-1 text-xs font-medium text-muted-foreground",
          expanded ? "glass-panel px-2.5" : "px-1.5",
        )}
        transition={{ type: "spring", stiffness: 400, damping: 32 }}
      >
        <span
          className={cn(
            "size-2 shrink-0 rounded-full transition-colors",
            DOT_CLASSES[state],
            state === "connecting" && "motion-safe:animate-pulse",
            state === "connected" && "opacity-60",
          )}
        />
        <AnimatePresence initial={false}>
          {expanded && (
            <motion.span
              key={state}
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: "auto" }}
              exit={{ opacity: 0, width: 0 }}
              className="overflow-hidden whitespace-nowrap"
            >
              {label}
            </motion.span>
          )}
        </AnimatePresence>
        {/* The collapsed dot has no visible text; the expanded states do, so
            announcing it again there would read the label twice. */}
        {!expanded && <span className="sr-only">{label}</span>}
      </motion.div>
    </div>
  );
}
