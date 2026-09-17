import type { PhotoFilters, PhotoSort } from "@/lib/api";
import { sceneCollectionLabel } from "@/lib/scenes";

/** A quick filter chip on the Photos page, kept in the URL as ?filter=. */
export type PhotosFilter =
  | { kind: "all" }
  | { kind: "favorites" }
  | { kind: "recent" }
  | { kind: "scene"; scene: string };

export const RECENT_DAYS = 30;

export function parsePhotosFilter(value: string | null): PhotosFilter {
  if (value === "favorites") return { kind: "favorites" };
  if (value === "recent") return { kind: "recent" };
  if (value?.startsWith("scene:") && value.length > 6) return { kind: "scene", scene: value.slice(6) };
  return { kind: "all" };
}

export function serializePhotosFilter(filter: PhotosFilter): string | null {
  switch (filter.kind) {
    case "all":
      return null;
    case "scene":
      return `scene:${filter.scene}`;
    default:
      return filter.kind;
  }
}

export function photosFilterKey(filter: PhotosFilter) {
  return serializePhotosFilter(filter) ?? "all";
}

export function photosFilterLabel(filter: PhotosFilter) {
  switch (filter.kind) {
    case "all":
      return "All";
    case "favorites":
      return "Favorites";
    case "recent":
      return "Recent";
    case "scene":
      return sceneCollectionLabel(filter.scene);
  }
}

/**
 * The API query for a chip. "Recent" means uploaded in the last 30 days,
 * newest upload first; the cut-off is the start of that day, so the query key
 * stays the same for the whole day instead of changing every render.
 */
export function photosFilterQuery(filter: PhotosFilter, sort: PhotoSort): { filters: PhotoFilters; sort: PhotoSort } {
  switch (filter.kind) {
    case "favorites":
      return { filters: { starred: true }, sort };
    case "recent": {
      const since = new Date();
      since.setHours(0, 0, 0, 0);
      since.setDate(since.getDate() - RECENT_DAYS);
      return { filters: { addedAfter: since.toISOString() }, sort: "added_desc" };
    }
    case "scene":
      return { filters: { scene: filter.scene }, sort };
    default:
      return { filters: {}, sort };
  }
}
