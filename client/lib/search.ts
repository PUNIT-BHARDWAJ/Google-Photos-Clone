/**
 * The search results URL; ai=1 asks for Gemini ranking of descriptive queries.
 * `extra` carries anything else to keep (the advanced filters).
 */
export function searchHref(query: string, ai = false, extra?: URLSearchParams) {
  const params = new URLSearchParams();
  if (query) params.set("q", query);
  if (ai) params.set("ai", "1");
  extra?.forEach((value, key) => {
    if (key !== "q" && key !== "ai") params.append(key, value);
  });
  const queryString = params.toString();
  return queryString ? `/search?${queryString}` : "/search";
}

export const MAX_RECENT_SEARCHES = 8;

/** Validates what's stored under the recent searches key. */
export function parseRecentSearches(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined;
  return value.filter((item): item is string => typeof item === "string" && item.trim().length > 0).slice(0, MAX_RECENT_SEARCHES);
}

/** Most recent first, without case-insensitive duplicates. */
export function addRecentSearch(recent: string[], query: string) {
  const trimmed = query.trim();
  if (!trimmed) return recent;
  const lower = trimmed.toLowerCase();
  return [trimmed, ...recent.filter((item) => item.toLowerCase() !== lower)].slice(0, MAX_RECENT_SEARCHES);
}
