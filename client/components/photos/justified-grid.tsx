"use client";

import { memo, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { PhotoTile } from "@/components/photos/photo-tile";
import { computeJustifiedRows } from "@/lib/justified-layout";
import type { Photo } from "@/lib/api";

const RESIZE_DEBOUNCE_MS = 100;

type JustifiedGridProps = {
  photos: Photo[];
  targetRowHeight?: number;
  gap?: number;
  selectedIds: Set<string>;
  selectionActive: boolean;
  onToggleSelect: (id: string) => void;
  onOpen: (photo: Photo) => void;
  renderTileMenu?: (photo: Photo) => React.ReactNode;
  /**
   * Entrance delay (seconds) for photos appearing for the first time. Photos
   * not in the map don't animate in - they've been seen before.
   */
  enterDelays: ReadonlyMap<string, number>;
};

// Memoized: a page re-render that leaves this day's photos, selection and
// handlers unchanged (e.g. the viewer moving to the next photo) skips every
// tile, including Framer Motion's per-tile render work.
export const JustifiedGrid = memo(function JustifiedGrid({
  photos,
  targetRowHeight = 220,
  gap = 4,
  selectedIds,
  selectionActive,
  onToggleSelect,
  onOpen,
  renderTileMenu,
  enterDelays,
}: JustifiedGridProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);

  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;

    let debounceId: ReturnType<typeof setTimeout> | null = null;

    function measure() {
      // Floored, not offsetWidth: that rounds to the nearest pixel, so a
      // 1105.6px container would lay out 1106px rows that overflow it.
      if (node) setContainerWidth(Math.floor(node.getBoundingClientRect().width));
    }

    const observer = new ResizeObserver(() => {
      if (debounceId) clearTimeout(debounceId);
      debounceId = setTimeout(measure, RESIZE_DEBOUNCE_MS);
    });
    observer.observe(node);

    // Initial measurement, deferred so it's a callback rather than a direct
    // setState call at the top of the effect body.
    debounceId = setTimeout(measure, 0);

    return () => {
      observer.disconnect();
      if (debounceId) clearTimeout(debounceId);
    };
  }, []);

  const rows = useMemo(
    () =>
      computeJustifiedRows(
        photos,
        (photo) => photo.width,
        (photo) => photo.height,
        containerWidth,
        targetRowHeight,
        gap,
      ),
    [photos, containerWidth, targetRowHeight, gap],
  );
  const cells = useMemo(() => rows.flatMap((row) => row.items), [rows]);

  // One flat flex-wrap list instead of a <div> per row: each full row sums to
  // exactly the container width, so lines break exactly where the layout put
  // them - and a tile keeps the same parent and key when a deletion or upload
  // moves it to another row. Per-row wrappers remounted those tiles, which
  // would replay their entrance and make the gap-closing animation impossible.
  return (
    <div ref={containerRef} className="relative flex flex-wrap" style={{ gap }}>
      {/* propagate: when a whole day section leaves (its last photo was
          deleted or unstarred), its tiles still play their own exit. */}
      <AnimatePresence mode="popLayout" propagate>
        {cells.map(({ photo, width, height }) => {
          const enterDelay = enterDelays.get(photo.id);
          return (
            <motion.div
              key={photo.id}
              // Glide to the new position when the layout changes (a photo
              // above was removed); the size snaps, since scaling a tile to a
              // new aspect ratio mid-flight would visibly distort the image.
              layout="position"
              // Only re-measure when the computed layout actually changed -
              // not on every selection toggle or star.
              layoutDependency={rows}
              initial={enterDelay === undefined ? false : { opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1, transition: { duration: 0.3, ease: "easeOut", delay: enterDelay ?? 0 } }}
              exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.3, ease: "easeIn" } }}
              transition={{ layout: { duration: 0.3, ease: "easeOut" } }}
              // Raised while hovered so the lifted tile's shadow overlaps its
              // neighbours (still below the sticky day heading at z-10).
              className="group/cell relative hover:z-[5]"
              style={{ width, height }}
            >
              {/* The hover shadow, pre-rendered and faded in with opacity (and
                  scaled with the tile) instead of transitioning box-shadow,
                  which would repaint the shadow on every frame. */}
              <span
                aria-hidden
                className="pointer-events-none absolute inset-0 rounded-lg opacity-0 shadow-lg transition-[opacity,scale] duration-150 ease-out group-hover/cell:scale-[1.02] group-hover/cell:opacity-100"
              />
              <PhotoTile
                photo={photo}
                width={width}
                height={height}
                selected={selectedIds.has(photo.id)}
                selectionActive={selectionActive}
                onToggleSelect={onToggleSelect}
                onOpen={onOpen}
                menu={renderTileMenu?.(photo)}
              />
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
});
