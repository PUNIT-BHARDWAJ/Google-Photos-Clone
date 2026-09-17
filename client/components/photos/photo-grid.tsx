"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { groupByDay } from "@/lib/format";
import { useInView } from "@/hooks/use-in-view";
import { useTargetRowHeight } from "@/hooks/use-target-row-height";
import { JustifiedGrid } from "@/components/photos/justified-grid";
import type { Photo } from "@/lib/api";

// Entrance stagger: 20ms per newly-appearing tile, capped so a big batch
// (initial load, the next infinite-scroll page) doesn't trickle in forever.
const ENTER_STAGGER_S = 0.02;
const ENTER_MAX_DELAY_S = 0.5;

type EntranceState = {
  seen: ReadonlySet<string>;
  delays: ReadonlyMap<string, number>;
};

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

function haveSameItems(a: readonly Photo[], b: readonly Photo[]) {
  return a.length === b.length && a.every((photo, index) => photo === b[index]);
}

function LoadingDots() {
  return (
    <motion.div
      role="status"
      aria-label="Loading more photos"
      className="flex items-center gap-1.5"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      {[0, 1, 2].map((dot) => (
        <span
          key={dot}
          className="size-2 animate-dot-bounce rounded-full bg-muted-foreground"
          style={{ animationDelay: `${dot * 0.15}s` }}
        />
      ))}
    </motion.div>
  );
}

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
  // Pages rebuild `photos` (flatMap over query pages) on every render - each
  // viewer arrow key, every dialog toggle - but TanStack Query keeps unchanged
  // Photo objects identical. Holding on to the previous array while its items
  // match keeps `groups`, and the memoized grids below, stable, so those
  // renders skip re-rendering and re-measuring every tile.
  const [stablePhotos, setStablePhotos] = useState(photos);
  if (photos !== stablePhotos && !haveSameItems(photos, stablePhotos)) {
    setStablePhotos(photos);
  }
  const groups = useMemo(() => groupByDay(stablePhotos), [stablePhotos]);

  // Pages pass inline handlers; stable wrappers that call the latest ones
  // keep them from defeating the grids' memoization.
  const onOpenRef = useRef(onOpen);
  const onToggleSelectRef = useRef(onToggleSelect);
  useLayoutEffect(() => {
    onOpenRef.current = onOpen;
    onToggleSelectRef.current = onToggleSelect;
  });
  const handleOpen = useCallback((photo: Photo) => onOpenRef.current(photo), []);
  const handleToggleSelect = useCallback((id: string) => onToggleSelectRef.current(id), []);
  const { ref: sentinelRef, inView } = useInView<HTMLDivElement>("800px");
  const targetRowHeight = useTargetRowHeight();

  // Which photos have already had their entrance, and the stagger delays for
  // the batch that most recently appeared. Updated during render when unseen
  // photos show up, so the new tiles mount with their delays in one pass. A
  // photo animates in once - re-renders, row reflows and refetches never
  // replay it - and a whole new batch staggers from zero rather than
  // continuing the count from the photos above it.
  const [entrance, setEntrance] = useState<EntranceState>(() => ({ seen: new Set(), delays: new Map() }));
  const unseen = stablePhotos.filter((photo) => !entrance.seen.has(photo.id));
  if (unseen.length > 0) {
    setEntrance({
      seen: new Set([...entrance.seen, ...unseen.map((photo) => photo.id)]),
      delays: new Map(
        unseen.map((photo, index) => [photo.id, Math.min(index * ENTER_STAGGER_S, ENTER_MAX_DELAY_S)]),
      ),
    });
  }

  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      onLoadMore?.();
    }
  }, [inView, hasNextPage, isFetchingNextPage, onLoadMore]);

  return (
    <div className="relative space-y-8">
      <AnimatePresence initial={false} mode="popLayout">
        {groups.map((group) => (
          <motion.section
            key={group.key}
            className="space-y-3"
            layout="position"
            layoutDependency={groups}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.3 } }}
            transition={{ duration: 0.2, layout: { duration: 0.3, ease: "easeOut" } }}
          >
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
              onToggleSelect={handleToggleSelect}
              onOpen={handleOpen}
              renderTileMenu={renderTileMenu}
              enterDelays={entrance.delays}
            />
          </motion.section>
        ))}
      </AnimatePresence>

      {(hasNextPage || isFetchingNextPage) && (
        // The sentinel stays mounted while more pages exist; the dots only
        // fade in while a page is actually loading.
        <div ref={sentinelRef} className="flex h-16 items-center justify-center">
          <AnimatePresence>{isFetchingNextPage && <LoadingDots />}</AnimatePresence>
        </div>
      )}
    </div>
  );
}
