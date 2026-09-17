"use client";

import { useEffect, useState } from "react";

const DESKTOP_BREAKPOINT = 1024;
const TABLET_BREAKPOINT = 768;

const DESKTOP_ROW_HEIGHT = 220;
const TABLET_ROW_HEIGHT = 180;
const MOBILE_ROW_HEIGHT = 150;

function resolveTargetRowHeight() {
  if (window.innerWidth >= DESKTOP_BREAKPOINT) return DESKTOP_ROW_HEIGHT;
  if (window.innerWidth >= TABLET_BREAKPOINT) return TABLET_ROW_HEIGHT;
  return MOBILE_ROW_HEIGHT;
}

// Server-rendered default (desktop) until the client can measure the real
// viewport - same tradeoff as the existing useIsMobile hook.
export function useTargetRowHeight() {
  const [height, setHeight] = useState(DESKTOP_ROW_HEIGHT);

  useEffect(() => {
    function update() {
      setHeight(resolveTargetRowHeight());
    }

    // Deferred rather than called synchronously here, so the very first
    // measurement is a callback (like the resize listener below) and not a
    // direct setState call at the top of the effect body.
    const timeoutId = setTimeout(update, 0);
    window.addEventListener("resize", update);

    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener("resize", update);
    };
  }, []);

  return height;
}
