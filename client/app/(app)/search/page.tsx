"use client";

import { useId, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  RiDownloadLine,
  RiEqualizerLine,
  RiFolderAddLine,
  RiInformationLine,
  RiSearchLine,
  RiSparkling2Fill,
} from "@remixicon/react";
import { Star } from "lucide-react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AnimatedNumber } from "@/components/ui/animated-number";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Spinner } from "@/components/ui/spinner";
import { ErrorState } from "@/components/layout/error-state";
import { AddToAlbumDialog } from "@/components/photos/add-to-album-dialog";
import { PhotoGrid } from "@/components/photos/photo-grid";
import { PhotoGridSkeleton } from "@/components/photos/photo-grid-skeleton";
import { PhotoToolbar, TOOLBAR_STICKY_OFFSET } from "@/components/photos/photo-toolbar";
import { PhotoViewer } from "@/components/photos/photo-viewer";
import { SelectionAction } from "@/components/photos/selection-toolbar";
import { ViewControls } from "@/components/photos/view-controls";
import { ActiveFilterChips, AdvancedSearchPanel } from "@/components/search/advanced-search-panel";
import { useAiEnabled, useTopTags } from "@/hooks/use-ai";
import { useGridDensity } from "@/hooks/use-grid-preferences";
import { useBulkSetStarred, useDownloadPhotos, usePhotoFacets, useSearchPhotos } from "@/hooks/use-photos";
import { useSelection } from "@/hooks/use-selection";
import type { Photo } from "@/lib/api";
import { searchHref } from "@/lib/search";
import {
  countSearchFilters,
  readSearchFilters,
  toApiFilters,
  writeSearchFilters,
  type SearchFilterState,
} from "@/lib/search-filters";
import { cn } from "@/lib/utils";

function TrySuggestions({ ai }: { ai: boolean }) {
  const aiEnabled = useAiEnabled();
  const { data: topTags } = useTopTags(aiEnabled);
  if (!topTags?.length) return null;

  return (
    <div className="flex flex-wrap items-center justify-center gap-1.5">
      <span className="text-sm text-muted-foreground">Try:</span>
      {topTags.map(({ tag }) => (
        <Link
          key={tag}
          href={searchHref(tag, ai)}
          className="rounded-full border border-border px-3 py-1 text-sm text-foreground transition-colors hover:bg-accent"
        >
          {tag}
        </Link>
      ))}
    </div>
  );
}

type FiltersButtonProps = {
  open: boolean;
  count: number;
  controls: string;
  onClick: () => void;
};

function FiltersButton({ open, count, controls, onClick }: FiltersButtonProps) {
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={onClick}
      aria-expanded={open}
      aria-controls={controls}
      className={cn(
        "shrink-0 gap-1.5",
        (open || count > 0) && "border-primary/30 bg-primary/10 text-primary hover:bg-primary/15 hover:text-primary dark:bg-primary/15",
      )}
    >
      <RiEqualizerLine />
      Filters
      {count > 0 && (
        <motion.span
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 500, damping: 25 }}
          className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[11px] text-primary-foreground"
        >
          <AnimatedNumber value={count} />
        </motion.span>
      )}
    </Button>
  );
}

export default function SearchPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const query = (searchParams.get("q") ?? "").trim();
  const ai = searchParams.get("ai") === "1";
  const aiEnabled = useAiEnabled();
  const panelId = useId();

  const filterString = ["from", "to", "scene", "color", "tag"]
    .flatMap((key) => searchParams.getAll(key).map((value) => `${key}=${value}`))
    .join("&");
  const filters = useMemo(
    () => readSearchFilters(new URLSearchParams(filterString)),
    [filterString],
  );
  const apiFilters = useMemo(() => toApiFilters(filters), [filters]);
  const filterCount = countSearchFilters(filters);
  const hasCriteria = query.length > 0 || filterCount > 0;

  const [density, setDensity] = useGridDensity();
  const [panelOpen, setPanelOpen] = useState(false);
  const { data: facets } = usePhotoFacets();
  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
    isRefetching,
    isPlaceholderData,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useSearchPhotos(query, ai, apiFilters);

  const selection = useSelection();
  const bulkSetStarred = useBulkSetStarred();
  const downloadPhotos = useDownloadPhotos();
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);
  const [addToAlbumOpen, setAddToAlbumOpen] = useState(false);

  // A new query or filter is a new result set - drop a selection made in the old one.
  const resultsKey = `${query}|${ai}|${filterString}`;
  const [prevResultsKey, setPrevResultsKey] = useState(resultsKey);
  if (resultsKey !== prevResultsKey) {
    setPrevResultsKey(resultsKey);
    selection.clear();
  }

  const photos = hasCriteria ? (data?.pages.flatMap((page) => page.content) ?? []) : [];
  const selectedPhotos = photos.filter((photo) => selection.selectedIds.has(photo.id));
  const allSelectedStarred = selectedPhotos.length > 0 && selectedPhotos.every((photo) => photo.starred);
  const firstPage = data?.pages[0];
  const totalCount = firstPage?.totalElements ?? 0;
  const searching = isLoading || isPlaceholderData;

  function updateFilters(next: SearchFilterState) {
    const params = writeSearchFilters(new URLSearchParams(searchParams), next);
    const queryString = params.toString();
    router.replace(queryString ? `${pathname}?${queryString}` : pathname, { scroll: false });
  }

  function togglePanel() {
    // The panel opens in place under the toolbar; bring it into view if the
    // user has scrolled down the results.
    if (!panelOpen && window.scrollY > 0) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
    setPanelOpen((open) => !open);
  }

  function handleOpen(photo: Photo) {
    const index = photos.findIndex((item) => item.id === photo.id);
    setViewerIndex(index === -1 ? null : index);
  }

  const title = query ? (
    <>Results for &ldquo;{query}&rdquo;</>
  ) : filterCount > 0 ? (
    "Filtered photos"
  ) : (
    "Search"
  );

  return (
    <div style={{ "--sticky-offset": TOOLBAR_STICKY_OFFSET } as React.CSSProperties}>
      <div className="mb-4">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">{title}</h1>
          {hasCriteria && firstPage?.aiRanked && (
            <Badge variant="secondary" className="gap-1 bg-primary/10 text-primary dark:bg-primary/15">
              <RiSparkling2Fill data-icon="inline-start" />
              AI-powered
            </Badge>
          )}
        </div>
        {!hasCriteria ? (
          <p className="text-sm text-muted-foreground">Search by words, or narrow down by date, scene, color and tag</p>
        ) : searching ? (
          <p className="flex items-center gap-2 text-sm text-muted-foreground" role="status">
            <Spinner className="size-3.5" />
            {ai && query ? "Ranking results with AI…" : "Searching…"}
          </p>
        ) : (
          <p className="text-sm text-muted-foreground" role="status">
            {totalCount} photo{totalCount === 1 ? "" : "s"} found
          </p>
        )}
        {hasCriteria && ai && firstPage?.aiMessage && (
          <p className="mt-1 flex items-start gap-1.5 text-xs text-muted-foreground">
            <RiInformationLine className="mt-px size-3.5 shrink-0" />
            {firstPage.aiMessage}
          </p>
        )}
      </div>

      <PhotoToolbar
        selectionCount={selection.count}
        onClearSelection={selection.clear}
        controls={<ViewControls density={density} onDensityChange={setDensity} />}
        selectionActions={
          <>
            <SelectionAction
              variant="outline"
              icon={<RiDownloadLine />}
              label="Download"
              onClick={() => downloadPhotos.mutate(selectedPhotos)}
              disabled={downloadPhotos.isPending}
            />
            <SelectionAction
              variant="outline"
              icon={<RiFolderAddLine />}
              label="Add to album"
              onClick={() => setAddToAlbumOpen(true)}
            />
            <SelectionAction
              variant="outline"
              icon={<Star className={allSelectedStarred ? "fill-amber-400 text-amber-400" : undefined} />}
              label={allSelectedStarred ? "Unstar" : "Star"}
              onClick={() => bulkSetStarred.mutate({ photos: selectedPhotos, starred: !allSelectedStarred })}
              disabled={bulkSetStarred.isPending}
            />
          </>
        }
      >
        <div className="flex min-w-0 flex-1 items-center gap-2 px-3">
          <FiltersButton open={panelOpen} count={filterCount} controls={panelId} onClick={togglePanel} />
          <div className="scrollbar-none flex min-w-0 flex-1 items-center gap-1.5 overflow-x-auto py-1 [mask-image:linear-gradient(to_right,black_calc(100%-24px),transparent)]">
            <ActiveFilterChips filters={filters} onChange={updateFilters} />
          </div>
        </div>
      </PhotoToolbar>

      <AdvancedSearchPanel
        id={panelId}
        open={panelOpen}
        filters={filters}
        onChange={updateFilters}
        onClose={() => setPanelOpen(false)}
        facets={facets}
      />

      {!hasCriteria ? (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <RiSearchLine />
            </EmptyMedia>
            <EmptyTitle>Search your photos</EmptyTitle>
            <EmptyDescription>
              {aiEnabled
                ? "Find photos by file name, or by what's in them once AI has analyzed your library"
                : "Start typing in the search bar to find photos by file name"}
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <TrySuggestions ai={ai} />
            {!panelOpen && (
              <Button variant="outline" size="sm" onClick={togglePanel}>
                <RiEqualizerLine />
                Browse with filters
              </Button>
            )}
          </EmptyContent>
        </Empty>
      ) : isLoading ? (
        <PhotoGridSkeleton />
      ) : isError && photos.length === 0 ? (
        <ErrorState error={error} onRetry={() => refetch()} retrying={isRefetching} />
      ) : photos.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <RiSearchLine />
            </EmptyMedia>
            <EmptyTitle>No photos match your search</EmptyTitle>
            <EmptyDescription>
              {filterCount > 0
                ? "Try removing a filter or widening the date range"
                : aiEnabled
                  ? "Try different words or a file name"
                  : "Try a different file name"}
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            {filterCount > 0 ? (
              <Button variant="outline" size="sm" onClick={() => updateFilters({ tags: [] })}>
                Clear filters
              </Button>
            ) : (
              <TrySuggestions ai={ai} />
            )}
          </EmptyContent>
        </Empty>
      ) : (
        <div className={cn("transition-opacity duration-200", isPlaceholderData && "opacity-60")}>
          <PhotoGrid
            photos={photos}
            selectedIds={selection.selectedIds}
            selectionActive={selection.isActive}
            onToggleSelect={selection.toggle}
            onOpen={handleOpen}
            hasNextPage={hasNextPage}
            isFetchingNextPage={isFetchingNextPage}
            onLoadMore={fetchNextPage}
            // Relevance order is the point of AI ranking - don't regroup it by day.
            groupByDate={!firstPage?.aiRanked}
            density={density}
          />
        </div>
      )}

      <PhotoViewer
        photos={photos}
        index={viewerIndex}
        onOpenChange={(open) => !open && setViewerIndex(null)}
        onIndexChange={setViewerIndex}
        renderActions={(photo) => (
          <Button
            variant="ghost"
            size="icon-sm"
            className="text-white hover:bg-white/10"
            onClick={() => downloadPhotos.mutate([photo])}
            disabled={downloadPhotos.isPending}
            aria-label="Download"
          >
            <RiDownloadLine className="size-4" />
          </Button>
        )}
      />

      <AddToAlbumDialog
        photoIds={selection.ids}
        open={addToAlbumOpen}
        onOpenChange={setAddToAlbumOpen}
        onDone={selection.clear}
      />
    </div>
  );
}
