"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";

const CHANGE_EVENT = "gp-stored-state-change";

function readRaw(key: string) {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function subscribe(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener(CHANGE_EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(CHANGE_EVENT, onChange);
  };
}

/**
 * A per-browser preference in localStorage (sidebar collapsed, grid density,
 * recent searches), shared live between components and tabs. Storage can be
 * unavailable (private mode) - reads then return the fallback and writes are
 * dropped. `parse` validates what's stored, so a stale or hand-edited value
 * can't break the UI.
 */
export function useStoredState<T>(
  key: string,
  fallback: T,
  parse: (value: unknown) => T | undefined,
): [T, (next: T | ((previous: T) => T)) => void] {
  const raw = useSyncExternalStore(
    subscribe,
    () => readRaw(key),
    () => null,
  );

  const value = useMemo(() => {
    if (raw === null) return fallback;
    try {
      return parse(JSON.parse(raw)) ?? fallback;
    } catch {
      return fallback;
    }
    // fallback and parse are expected to be stable (module-level) values.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [raw]);

  const setValue = useCallback(
    (next: T | ((previous: T) => T)) => {
      let current = fallback;
      const stored = readRaw(key);
      if (stored !== null) {
        try {
          current = parse(JSON.parse(stored)) ?? fallback;
        } catch {
          // Unreadable - start from the fallback.
        }
      }
      const resolved = typeof next === "function" ? (next as (previous: T) => T)(current) : next;
      try {
        window.localStorage.setItem(key, JSON.stringify(resolved));
      } catch {
        // Storage unavailable - the preference just won't persist.
      }
      window.dispatchEvent(new Event(CHANGE_EVENT));
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [key],
  );

  return [value, setValue];
}
