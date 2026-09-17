"use client";

import { MotionGlobalConfig } from "framer-motion";

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

// Users who ask for reduced motion get every Framer Motion animation completing
// instantly. This replaces MotionConfig's reducedMotion="user", which only
// drops transform/layout animations (opacity still fades) and logs a dev
// warning on every reduced-motion device. Set at module load, so it's in place
// before the first page transition or tile entrance renders, and kept in sync
// if the OS setting changes while the app is open.
if (typeof window !== "undefined") {
  const query = window.matchMedia(REDUCED_MOTION_QUERY);
  MotionGlobalConfig.skipAnimations = query.matches;
  query.addEventListener("change", (event) => {
    MotionGlobalConfig.skipAnimations = event.matches;
  });
}

export function MotionProvider({ children }: { children: React.ReactNode }) {
  return children;
}
