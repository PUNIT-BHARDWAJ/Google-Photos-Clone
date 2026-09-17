"use client";

import { useEffect, useState } from "react";

const TOP_ZONE_PX = 64;
const DIRECTION_THRESHOLD_PX = 8;

/**
 * True while the user is scrolling down the page (hide the chrome), false as
 * soon as they scroll back up or return near the top. Small jitters under the
 * threshold are ignored so the bar doesn't flicker mid-scroll.
 */
export function useHideOnScroll(enabled = true) {
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    if (!enabled) return;
    let lastY = window.scrollY;
    let frame = 0;

    function update() {
      frame = 0;
      const y = window.scrollY;
      const delta = y - lastY;
      if (y < TOP_ZONE_PX) {
        setHidden(false);
        lastY = y;
      } else if (Math.abs(delta) >= DIRECTION_THRESHOLD_PX) {
        setHidden(delta > 0);
        lastY = y;
      }
    }

    function onScroll() {
      if (!frame) frame = requestAnimationFrame(update);
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [enabled]);

  return enabled && hidden;
}
