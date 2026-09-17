import type { Photo } from "@/lib/api";

// Row heights in the justified grid cluster around the target heights (150 /
// 180 / 220px), so snapping requests to a few fixed steps keeps the number of
// distinct renditions - and so CDN cache misses - small, instead of asking
// ImageKit for a new size for every pixel of row height.
const HEIGHT_STEPS = [120, 180, 240, 320, 480, 640, 960, 1280];

// Animated GIFs and vector SVGs are better served untouched than resized.
const UNTRANSFORMABLE_TYPES = new Set(["image/gif", "image/svg+xml"]);

function snapHeight(px: number) {
  return HEIGHT_STEPS.find((step) => step >= px) ?? HEIGHT_STEPS[HEIGHT_STEPS.length - 1];
}

function isImageKitUrl(url: URL) {
  // A URL that already carries path-based transforms (".../tr:...") can't
  // also take a query transform cleanly.
  return url.hostname.endsWith("ik.imagekit.io") && !url.pathname.includes("/tr:");
}

function withHeightTransform(url: URL, height: number) {
  const next = new URL(url);
  // Height-only keeps the photo's own aspect ratio - unlike the square
  // library thumbnail, which letterboxes wide photos into 440x440 and leaves a
  // 3:1 panorama with just 440x147 real pixels behind its tile.
  next.searchParams.set("tr", `h-${height},f-auto`);
  return next.toString();
}

function transformableUrl(photo: Pick<Photo, "url" | "mimeType">): URL | null {
  if (photo.mimeType && UNTRANSFORMABLE_TYPES.has(photo.mimeType)) return null;
  try {
    const url = new URL(photo.url);
    return isImageKitUrl(url) ? url : null;
  } catch {
    return null;
  }
}

/**
 * A ~16px-tall, low-quality rendition (a few hundred bytes) for blur-up
 * loading: shown blurred while the real tile image downloads, so a tile
 * crossfades from a colour-accurate blur instead of popping in from an
 * empty grey box. Null when the photo can't be resized by ImageKit.
 */
export function getPlaceholderSrc(photo: Pick<Photo, "url" | "mimeType">): string | null {
  const url = transformableUrl(photo);
  if (!url) return null;
  const next = new URL(url);
  next.searchParams.set("tr", "h-16,q-40,f-auto");
  return next.toString();
}

/**
 * A mid-size rendition to show in the photo viewer while the full-resolution
 * original loads. It matches the 1x grid rendition for most desktop rows, so
 * it's usually already in the browser cache when a photo is opened.
 */
export function getViewerPreviewSrc(photo: Pick<Photo, "url" | "mimeType">): string | null {
  const url = transformableUrl(photo);
  return url ? withHeightTransform(url, 240) : null;
}

/**
 * `src`/`srcSet` for a grid tile rendered `displayHeight` CSS pixels tall:
 * a 1x rendition plus a 2x one for high-DPI screens.
 */
export function getTileImageSources(
  photo: Pick<Photo, "url" | "thumbnailUrl" | "mimeType">,
  displayHeight: number,
): { src: string; srcSet?: string } {
  const url = transformableUrl(photo);
  if (!url) return { src: photo.thumbnailUrl || photo.url };

  const oneX = withHeightTransform(url, snapHeight(displayHeight));
  const twoX = withHeightTransform(url, snapHeight(displayHeight * 2));
  return { src: oneX, srcSet: `${oneX} 1x, ${twoX} 2x` };
}
