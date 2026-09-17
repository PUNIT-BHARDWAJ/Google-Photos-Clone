"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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
};

export function JustifiedGrid({
  photos,
  targetRowHeight = 220,
  gap = 4,
  selectedIds,
  selectionActive,
  onToggleSelect,
  onOpen,
  renderTileMenu,
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

  return (
    <div ref={containerRef} className="flex flex-col" style={{ gap }}>
      {rows.map((row, rowIndex) => (
        <div key={rowIndex} className="flex" style={{ gap }}>
          {row.items.map(({ photo, width, height }) => (
            <PhotoTile
              key={photo.id}
              photo={photo}
              width={width}
              height={height}
              selected={selectedIds.has(photo.id)}
              selectionActive={selectionActive}
              onToggleSelect={onToggleSelect}
              onOpen={onOpen}
              menu={renderTileMenu?.(photo)}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
