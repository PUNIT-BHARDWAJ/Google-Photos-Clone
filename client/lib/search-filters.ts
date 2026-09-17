import type { PhotoFilters } from "@/lib/api";

/** Advanced search filters as they live in the URL: dates as yyyy-mm-dd, inclusive. */
export type SearchFilterState = {
  from?: string;
  to?: string;
  scene?: string;
  color?: string;
  tags: string[];
};

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export function readSearchFilters(params: URLSearchParams): SearchFilterState {
  const date = (value: string | null) => (value && DATE_PATTERN.test(value) ? value : undefined);
  return {
    from: date(params.get("from")),
    to: date(params.get("to")),
    scene: params.get("scene") || undefined,
    color: params.get("color") || undefined,
    tags: params.getAll("tag").filter(Boolean),
  };
}

/** Writes the filters into a copy of the current params, leaving q and ai as they are. */
export function writeSearchFilters(params: URLSearchParams, filters: SearchFilterState) {
  const next = new URLSearchParams(params);
  for (const key of ["from", "to", "scene", "color", "tag"]) next.delete(key);
  if (filters.from) next.set("from", filters.from);
  if (filters.to) next.set("to", filters.to);
  if (filters.scene) next.set("scene", filters.scene);
  if (filters.color) next.set("color", filters.color);
  filters.tags.forEach((tag) => next.append("tag", tag));
  return next;
}

export function countSearchFilters(filters: SearchFilterState) {
  return (filters.from || filters.to ? 1 : 0) + (filters.scene ? 1 : 0) + (filters.color ? 1 : 0) + filters.tags.length;
}

function localDay(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

/** Local calendar days become instants: from midnight on "from" up to (not including) the day after "to". */
export function toApiFilters(filters: SearchFilterState): PhotoFilters {
  const api: PhotoFilters = {};
  if (filters.from) api.from = localDay(filters.from).toISOString();
  if (filters.to) {
    const end = localDay(filters.to);
    end.setDate(end.getDate() + 1);
    api.to = end.toISOString();
  }
  if (filters.scene) api.scene = filters.scene;
  if (filters.color) api.color = filters.color;
  if (filters.tags.length) api.tags = filters.tags;
  return api;
}

export function formatDateInput(date: Date) {
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export type DatePreset = { key: string; label: string; from: string; to: string };

/** Quick ranges for the date filter, ending today (local time). */
export function datePresets(today = new Date()): DatePreset[] {
  const todayValue = formatDateInput(today);
  const daysAgo = (days: number) => {
    const date = new Date(today.getFullYear(), today.getMonth(), today.getDate() - days);
    return formatDateInput(date);
  };
  const year = today.getFullYear();
  return [
    { key: "7d", label: "Last 7 days", from: daysAgo(6), to: todayValue },
    { key: "30d", label: "Last 30 days", from: daysAgo(29), to: todayValue },
    { key: "year", label: "This year", from: `${year}-01-01`, to: todayValue },
    { key: "last-year", label: "Last year", from: `${year - 1}-01-01`, to: `${year - 1}-12-31` },
  ];
}

/** "Mar 1 – Mar 31, 2026", "From Mar 1, 2026", "Until Mar 31, 2026". */
export function formatDateRange(from?: string, to?: string) {
  const long = new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", year: "numeric" });
  const short = new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" });
  if (from && to) {
    const start = localDay(from);
    const end = localDay(to);
    if (from === to) return long.format(start);
    const sameYear = start.getFullYear() === end.getFullYear();
    return `${(sameYear ? short : long).format(start)} – ${long.format(end)}`;
  }
  if (from) return `From ${long.format(localDay(from))}`;
  if (to) return `Until ${long.format(localDay(to))}`;
  return "";
}
