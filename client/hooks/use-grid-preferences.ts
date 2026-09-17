"use client";

import { useStoredState } from "@/hooks/use-stored-state";
import type { PhotoSort } from "@/lib/api";

export type GridDensity = "compact" | "comfortable" | "spacious";

export const DENSITY_OPTIONS: { value: GridDensity; label: string }[] = [
  { value: "compact", label: "Compact" },
  { value: "comfortable", label: "Comfortable" },
  { value: "spacious", label: "Spacious" },
];

/** Multiplier on the responsive target row height (220 / 180 / 150px). */
export const DENSITY_SCALE: Record<GridDensity, number> = {
  compact: 0.7,
  comfortable: 1,
  spacious: 1.4,
};

export const SORT_OPTIONS: { value: PhotoSort; label: string }[] = [
  { value: "taken_desc", label: "Date taken (newest)" },
  { value: "taken_asc", label: "Date taken (oldest)" },
  { value: "added_desc", label: "Date added (newest)" },
  { value: "added_asc", label: "Date added (oldest)" },
];

function parseDensity(value: unknown): GridDensity | undefined {
  return DENSITY_OPTIONS.some((option) => option.value === value) ? (value as GridDensity) : undefined;
}

function parseSort(value: unknown): PhotoSort | undefined {
  return SORT_OPTIONS.some((option) => option.value === value) ? (value as PhotoSort) : undefined;
}

/** Grid density, remembered across pages and visits. */
export function useGridDensity() {
  return useStoredState<GridDensity>("gp-grid-density", "comfortable", parseDensity);
}

/** Timeline sort, remembered across the pages that offer it. */
export function useGridSort() {
  return useStoredState<PhotoSort>("gp-grid-sort", "taken_desc", parseSort);
}
