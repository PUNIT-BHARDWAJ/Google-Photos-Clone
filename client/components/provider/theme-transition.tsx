"use client";

import { useEffect } from "react";

const TRANSITION_CLASS = "theme-transition";
// A little longer than the 200ms color transition in globals.css.
const TRANSITION_MS = 250;
// If an armed switch never changes the theme (e.g. picking the current one).
const ARM_TIMEOUT_MS = 1000;

let removeTimer: ReturnType<typeof setTimeout> | undefined;

function scheduleRemoval(delay: number) {
  clearTimeout(removeTimer);
  removeTimer = setTimeout(() => document.documentElement.classList.remove(TRANSITION_CLASS), delay);
}

/**
 * Call right before changing the theme. The transition class has to be on
 * <html> before the new theme's colors are computed: added afterwards, even in
 * the same frame, work that reads styles in between (the menu closing, React
 * layout effects) has already applied the new colors with no transition.
 */
export function armThemeTransition() {
  document.documentElement.classList.add(TRANSITION_CLASS);
  scheduleRemoval(ARM_TIMEOUT_MS);
}

/**
 * Cross-fades colors when the theme changes. The toggles arm the transition
 * themselves; this covers the changes they don't start - the OS theme while
 * set to "System", or the theme picked in another tab. Its listeners are
 * registered before next-themes' own (child effects run before the provider's),
 * so the class is in place by the time next-themes swaps the theme. Once the
 * `dark` class actually flips, the class is kept just long enough for the
 * 200ms transition to finish. Nothing is armed on load, so first paint never
 * animates.
 */
export function ThemeTransition() {
  useEffect(() => {
    const root = document.documentElement;
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    let isDark = root.classList.contains("dark");

    const onStorage = (event: StorageEvent) => {
      if (event.key === "theme") armThemeTransition();
    };
    media.addEventListener("change", armThemeTransition);
    window.addEventListener("storage", onStorage);

    const observer = new MutationObserver(() => {
      const nowDark = root.classList.contains("dark");
      if (nowDark === isDark) return;
      isDark = nowDark;
      if (root.classList.contains(TRANSITION_CLASS)) scheduleRemoval(TRANSITION_MS);
    });
    observer.observe(root, { attributes: true, attributeFilter: ["class"] });

    return () => {
      media.removeEventListener("change", armThemeTransition);
      window.removeEventListener("storage", onStorage);
      observer.disconnect();
      clearTimeout(removeTimer);
      root.classList.remove(TRANSITION_CLASS);
    };
  }, []);

  return null;
}
