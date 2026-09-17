"use client";

import { useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  RiArchiveLine,
  RiDeleteBinLine,
  RiDownloadLine,
  RiFolderAddLine,
  RiImageLine,
  RiStarLine,
  RiTimeLine,
} from "@remixicon/react";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { ErrorState } from "@/components/layout/error-state";
import { FilterChipBar, type FilterChip } from "@/components/photos/filter-chip-bar";
import { PhotoGrid } from "@/components/photos/photo-grid";
import { PhotoGridSkeleton } from "@/components/photos/photo-grid-skeleton";
import { PhotoToolbar, TOOLBAR_STICKY_OFFSET } from "@/components/photos/photo-toolbar";
import { PhotoViewer } from "@/components/photos/photo-viewer";
import { SelectionAction } from "@/components/photos/selection-toolbar";
import { ViewControls } from "@/components/photos/view-controls";
import { AddPhotosMenu } from "@/components/photos/add-photos-menu";
import { AddToAlbumDialog } from "@/components/photos/add-to-album-dialog";
import { useGridDensity, useGridSort } from "@/hooks/use-grid-preferences";
import {
  useArchivePhotos,
  useBulkSetStarred,
  useDownloadPhotos,
  usePhotoFacets,
  usePhotos,
  useTrashPhotos,
} from "@/hooks/use-photos";
import { useSelection } from "@/hooks/use-selection";
import { useSettledValue } from "@/hooks/use-settled-value";
import type { Photo } from "@/lib/api";
import { parsePhotosFilter, photosFilterKey, photosFilterLabel, photosFilterQuery, RECENT_DAYS } from "@/lib/photo-filters";
import { sceneCollectionLabel, sceneIcon } from "@/lib/scenes";
import { cn } from "@/lib/utils";

const viewerActionClass = "text-white hover:bg-white/10";

export default function PhotosPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const filterParam = searchParams.get("filter");
  const filter = useMemo(() => parsePhotosFilter(filterParam), [filterParam]);
  const activeKey = photosFilterKey(filter);

  const [density, setDensity] = useGridDensity();
  const [preferredSort, setPreferredSort] = useGridSort();
  const { filters, sort } = useMemo(() => photosFilterQuery(filter, preferredSort), [filter, preferredSort]);

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
  } = usePhotos("ACTIVE", { filters, sort });
  const displayedSort = useSettledValue(sort, !isPlaceholderData);
  const { data: facets } = usePhotoFacets();

  const selection = useSelection();
  const archivePhotos = useArchivePhotos();
  const trashPhotos = useTrashPhotos();
  const bulkSetStarred = useBulkSetStarred();
  const downloadPhotos = useDownloadPhotos();
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);
  const [addToAlbumOpen, setAddToAlbumOpen] = useState(false);

  const photos = data?.pages.flatMap((page) => page.content) ?? [];
  const selectedPhotos = photos.filter((photo) => selection.selectedIds.has(photo.id));
  const allSelectedStarred = selectedPhotos.length > 0 && selectedPhotos.every((photo) => photo.starred);

  const chips = useMemo<FilterChip[]>(() => {
    const sceneChips = (facets?.scenes ?? []).map((scene) => ({
      key: `scene:${scene.value}`,
      label: sceneCollectionLabel(scene.value),
      icon: sceneIcon(scene.value),
      count: scene.count,
    }));
    // A scene that's no longer in the library (from an old link) still shows as selected.
    if (filter.kind === "scene" && !sceneChips.some((chip) => chip.key === activeKey)) {
      sceneChips.push({ key: activeKey, label: photosFilterLabel(filter), icon: sceneIcon(filter.scene), count: 0 });
    }
    return [
      { key: "all", label: "All" },
      { key: "favorites", label: "Favorites", icon: RiStarLine },
      { key: "recent", label: "Recent", icon: RiTimeLine },
      ...sceneChips,
    ];
  }, [facets, filter, activeKey]);

  function selectFilter(key: string) {
    const params = new URLSearchParams(searchParams);
    if (key === "all") params.delete("filter");
    else params.set("filter", key);
    selection.clear();
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }

  function handleOpen(photo: Photo) {
    const index = photos.findIndex((item) => item.id === photo.id);
    setViewerIndex(index === -1 ? null : index);
  }

  if (isLoading) {
    return <PhotoGridSkeleton />;
  }

  const emptyState =
    filter.kind === "all"
      ? { title: "No photos yet", description: "Upload your first photos to get started" }
      : filter.kind === "favorites"
        ? { title: "No favorites yet", description: "Star photos to find them here" }
        : filter.kind === "recent"
          ? { title: "Nothing added recently", description: `Photos you upload show up here for ${RECENT_DAYS} days` }
          : { title: `No ${photosFilterLabel(filter).toLowerCase()} photos`, description: "Try another filter" };

  return (
    <div style={{ "--sticky-offset": TOOLBAR_STICKY_OFFSET } as React.CSSProperties}>
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Photos</h1>
          <p className="text-sm text-muted-foreground">All your memories, backed up automatically</p>
        </div>
        <AddPhotosMenu />
      </div>

      <PhotoToolbar
        selectionCount={selection.count}
        onClearSelection={selection.clear}
        controls={
          <ViewControls
            density={density}
            onDensityChange={setDensity}
            sort={preferredSort}
            onSortChange={setPreferredSort}
            sortDisabled={filter.kind === "recent"}
          />
        }
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
            <SelectionAction
              variant="outline"
              icon={<RiArchiveLine />}
              label="Archive"
              onClick={() => archivePhotos.mutate(selection.ids, { onSuccess: selection.clear })}
              disabled={archivePhotos.isPending}
            />
            <SelectionAction
              variant="destructive"
              icon={<RiDeleteBinLine />}
              label="Delete"
              onClick={() => trashPhotos.mutate(selection.ids, { onSuccess: selection.clear })}
              disabled={trashPhotos.isPending}
            />
          </>
        }
      >
        <FilterChipBar chips={chips} activeKey={activeKey} onSelect={selectFilter} label="Filter photos" />
      </PhotoToolbar>

      {isError && photos.length === 0 ? (
        <ErrorState error={error} onRetry={() => refetch()} retrying={isRefetching} />
      ) : photos.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <RiImageLine />
            </EmptyMedia>
            <EmptyTitle>{emptyState.title}</EmptyTitle>
            <EmptyDescription>{emptyState.description}</EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            {filter.kind === "all" ? (
              <AddPhotosMenu />
            ) : (
              <Button variant="outline" onClick={() => selectFilter("all")}>
                Show all photos
              </Button>
            )}
          </EmptyContent>
        </Empty>
      ) : (
        // Dimmed while a new filter or sort is loading over the previous results.
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
            density={density}
            sort={displayedSort}
          />
        </div>
      )}

      <PhotoViewer
        photos={photos}
        index={viewerIndex}
        onOpenChange={(open) => !open && setViewerIndex(null)}
        onIndexChange={setViewerIndex}
        renderActions={(photo) => (
          <>
            <Button
              variant="ghost"
              size="icon-sm"
              className={viewerActionClass}
              onClick={() => downloadPhotos.mutate([photo])}
              disabled={downloadPhotos.isPending}
              aria-label="Download"
            >
              <RiDownloadLine className="size-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              className={viewerActionClass}
              onClick={() => {
                selection.toggle(photo.id);
                setAddToAlbumOpen(true);
              }}
              aria-label="Add to album"
            >
              <RiFolderAddLine className="size-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              className={viewerActionClass}
              onClick={() => archivePhotos.mutate([photo.id])}
              aria-label="Archive"
            >
              <RiArchiveLine className="size-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              className={viewerActionClass}
              onClick={() => {
                trashPhotos.mutate([photo.id]);
                setViewerIndex(null);
              }}
              aria-label="Delete"
            >
              <RiDeleteBinLine className="size-4" />
            </Button>
          </>
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
