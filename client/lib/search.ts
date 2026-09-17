/** The search results URL; ai=1 asks for Gemini ranking of descriptive queries. */
export function searchHref(query: string, ai = false) {
  const params = new URLSearchParams({ q: query });
  if (ai) params.set("ai", "1");
  return `/search?${params.toString()}`;
}
