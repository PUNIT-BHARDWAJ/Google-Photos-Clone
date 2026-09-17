"use client";

import { useEffect, useMemo } from "react";
import { groupByDay } from "@/lib/format";
import { useInView } from "@/hooks/use-in-view";
import { useTargetRowHeight } from "@/hooks/use-target-row-height";
import { Spinner } from "@/components/ui/spinner";
import { JustifiedGrid } from "@/components/photos/justified-grid";
import type { Photo } from "@/lib/api";

type PhotoGridProps = {
  photos: Photo[];
  selectedIds: Set<string>;
  selectionActive: boolean;
  onToggleSelect: (id: string) => void;
  onOpen: (photo: Photo) => void;
  hasNextPage?: boolean;
  isFetchingNextPage?: boolean;
  onLoadMore?: () => void;
  renderTileMenu?: (photo: Photo) => React.ReactNode;
};

export function PhotoGrid({
  photos,
  selectedIds,
  selectionActive,
  onToggleSelect,
  onOpen,
  hasNextPage,
  isFetchingNextPage,
  onLoadMore,
  renderTileMenu,
}: PhotoGridProps) {
  const groups = useMemo(() => groupByDay(photos), [photos]);
  const { ref: sentinelRef, inView } = useInView<HTMLDivElement>("800px");
  const targetRowHeight = useTargetRowHeight();

  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      onLoadMore?.();
    }
  }, [inView, hasNextPage, isFetchingNextPage, onLoadMore]);

  return (
    <div className="space-y-8">
      {groups.map((group) => (
        <section key={group.key} className="space-y-3">
          {/* The app shell's sticky header is 60.8px tall (py-3 + 36px search
              bar + hairline border) at every breakpoint. Sticking at 60px tucks
              the heading a fraction under it (the header's z-20 wins) - top-16
              left a 3px strip where scrolled photos showed through. */}
          <h2 className="sticky top-[60px] z-10 -mx-1 bg-background/90 px-1 py-2 text-sm font-medium text-foreground backdrop-blur-sm">
            {group.heading}
          </h2>
          <JustifiedGrid
            photos={group.items}
            targetRowHeight={targetRowHeight}
            selectedIds={selectedIds}
            selectionActive={selectionActive}
            onToggleSelect={onToggleSelect}
            onOpen={onOpen}
            renderTileMenu={renderTileMenu}
          />
        </section>
      ))}

      {hasNextPage && (
        <div ref={sentinelRef} className="flex justify-center py-8">
          <Spinner className="size-5 text-muted-foreground" />
        </div>
      )}
    </div>
  );
}
