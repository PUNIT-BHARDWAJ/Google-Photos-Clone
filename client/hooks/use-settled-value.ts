"use client";

import { useState } from "react";

/**
 * The value as of the last time `settled` was true. While a query for a new
 * sort order is still showing the previous results, the grid keeps grouping
 * them the old way - otherwise it would rearrange twice (once for the old
 * photos in the new order, again when the new photos arrive).
 */
export function useSettledValue<T>(value: T, settled: boolean): T {
  const [shown, setShown] = useState(value);
  if (settled && !Object.is(shown, value)) {
    setShown(value);
  }
  return settled ? value : shown;
}
