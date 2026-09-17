// Row-based justified layout, like Google Photos/Flickr/500px - NOT CSS
// columns/masonry, which reflow into per-column reading order and break
// chronological left-to-right ordering.

export const DEFAULT_ASPECT_RATIO = 3 / 2;

export type JustifiedItem<T> = {
  photo: T;
  width: number;
  height: number;
};

export type JustifiedRow<T> = {
  items: JustifiedItem<T>[];
  height: number;
};

function getAspectRatio(width: number | null | undefined, height: number | null | undefined): number {
  if (width && height && width > 0 && height > 0) {
    return width / height;
  }
  return DEFAULT_ASPECT_RATIO;
}

export function computeJustifiedRows<T>(
  photos: T[],
  getWidth: (photo: T) => number | null | undefined,
  getHeight: (photo: T) => number | null | undefined,
  containerWidth: number,
  targetRowHeight: number,
  gap: number,
): JustifiedRow<T>[] {
  if (containerWidth <= 0 || photos.length === 0) return [];

  const rows: JustifiedRow<T>[] = [];
  let currentRow: { photo: T; aspectRatio: number }[] = [];
  let currentRowAspectSum = 0;

  function flushRow(stretch: boolean) {
    if (currentRow.length === 0) return;

    const totalGap = gap * (currentRow.length - 1);
    const availableWidth = Math.max(Math.floor(containerWidth - totalGap), 1);
    const rowHeight = stretch ? availableWidth / currentRowAspectSum : targetRowHeight;
    const height = Math.round(rowHeight);

    // Rounding every tile independently lets a stretched row drift a pixel or
    // two past (or short of) the container edge. The last tile takes whatever
    // width is left instead, so every full row ends exactly flush.
    let usedWidth = 0;
    const items: JustifiedItem<T>[] = currentRow.map(({ photo, aspectRatio }, index) => {
      const isLast = index === currentRow.length - 1;
      // The unstretched last row is floored rather than rounded: the grid
      // renders every tile in one flex-wrap container, so a row that rounded
      // up past the container width would wrap its final tile onto a new line.
      const width =
        stretch && isLast
          ? Math.max(availableWidth - usedWidth, 1)
          : stretch
            ? Math.round(aspectRatio * rowHeight)
            : Math.max(Math.floor(aspectRatio * rowHeight), 1);
      usedWidth += width;
      return { photo, width, height };
    });

    rows.push({ items, height });
    currentRow = [];
    currentRowAspectSum = 0;
  }

  for (const photo of photos) {
    const aspectRatio = getAspectRatio(getWidth(photo), getHeight(photo));
    currentRow.push({ photo, aspectRatio });
    currentRowAspectSum += aspectRatio;

    const rowWidthAtTargetHeight = currentRowAspectSum * targetRowHeight + gap * (currentRow.length - 1);
    if (rowWidthAtTargetHeight >= containerWidth) {
      flushRow(true);
    }
  }

  // Last (possibly incomplete) row: natural size, left-aligned, never
  // stretched - one or two photos filling the full width would look wrong.
  flushRow(false);

  return rows;
}
