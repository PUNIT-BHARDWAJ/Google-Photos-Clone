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

/**
 * `src`/`srcSet` for a grid tile rendered `displayHeight` CSS pixels tall:
 * a 1x rendition plus a 2x one for high-DPI screens.
 */
export function getTileImageSources(
  photo: Pick<Photo, "url" | "thumbnailUrl" | "mimeType">,
  displayHeight: number,
): { src: string; srcSet?: string } {
  const fallback = { src: photo.thumbnailUrl || photo.url };
  if (photo.mimeType && UNTRANSFORMABLE_TYPES.has(photo.mimeType)) return fallback;

  let url: URL;
  try {
    url = new URL(photo.url);
  } catch {
    return fallback;
  }
  if (!isImageKitUrl(url)) return fallback;

  const oneX = withHeightTransform(url, snapHeight(displayHeight));
  const twoX = withHeightTransform(url, snapHeight(displayHeight * 2));
  return { src: oneX, srcSet: `${oneX} 1x, ${twoX} 2x` };
}
