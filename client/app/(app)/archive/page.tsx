"use client";

import { useState } from "react";
import { RiArchive2Line, RiArrowGoBackLine, RiDeleteBinLine, RiDownloadLine, RiFolderAddLine } from "@remixicon/react";
import { Button } from "@/components/ui/button";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { ErrorState } from "@/components/layout/error-state";
import { AddToAlbumDialog } from "@/components/photos/add-to-album-dialog";
import { PhotoGrid } from "@/components/photos/photo-grid";
import { PhotoGridSkeleton } from "@/components/photos/photo-grid-skeleton";
import { PhotoToolbar, TOOLBAR_STICKY_OFFSET } from "@/components/photos/photo-toolbar";
import { PhotoViewer } from "@/components/photos/photo-viewer";
import { SelectionAction } from "@/components/photos/selection-toolbar";
import { ViewControls } from "@/components/photos/view-controls";
import { useGridDensity, useGridSort } from "@/hooks/use-grid-preferences";
import { useDownloadPhotos, usePhotos, useRestorePhotos, useTrashPhotos } from "@/hooks/use-photos";
import { useSelection } from "@/hooks/use-selection";
import { useSettledValue } from "@/hooks/use-settled-value";
import type { Photo } from "@/lib/api";
import { cn } from "@/lib/utils";

const viewerActionClass = "text-white hover:bg-white/10";

export default function ArchivePage() {
  const [density, setDensity] = useGridDensity();
  const [sort, setSort] = useGridSort();
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
  } = usePhotos("ARCHIVE", { sort });
  const displayedSort = useSettledValue(sort, !isPlaceholderData);
  const selection = useSelection();
  const restorePhotos = useRestorePhotos();
  const trashPhotos = useTrashPhotos();
  const downloadPhotos = useDownloadPhotos();
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);
  const [addToAlbumOpen, setAddToAlbumOpen] = useState(false);

  const photos = data?.pages.flatMap((page) => page.content) ?? [];
  const selectedPhotos = photos.filter((photo) => selection.selectedIds.has(photo.id));

  function handleOpen(photo: Photo) {
    const index = photos.findIndex((item) => item.id === photo.id);
    setViewerIndex(index === -1 ? null : index);
  }

  if (isLoading) {
    return <PhotoGridSkeleton />;
  }

  return (
    <div style={{ "--sticky-offset": TOOLBAR_STICKY_OFFSET } as React.CSSProperties}>
      <div className="mb-4">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Archive</h1>
        <p className="text-sm text-muted-foreground">Photos hidden from your main library</p>
      </div>

      <PhotoToolbar
        selectionCount={selection.count}
        onClearSelection={selection.clear}
        controls={<ViewControls density={density} onDensityChange={setDensity} sort={sort} onSortChange={setSort} />}
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
              icon={<RiArrowGoBackLine />}
              label="Unarchive"
              onClick={() => restorePhotos.mutate(selection.ids, { onSuccess: selection.clear })}
              disabled={restorePhotos.isPending}
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
        {photos.length > 0 && (
          <p className="px-3 text-sm text-muted-foreground">
            {data?.pages[0]?.totalElements ?? photos.length} archived
          </p>
        )}
      </PhotoToolbar>

      {isError && photos.length === 0 ? (
        <ErrorState error={error} onRetry={() => refetch()} retrying={isRefetching} />
      ) : photos.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <RiArchive2Line />
            </EmptyMedia>
            <EmptyTitle>Archive is empty</EmptyTitle>
            <EmptyDescription>Photos you archive will show up here, hidden from your main library</EmptyDescription>
          </EmptyHeader>
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
              onClick={() => {
                restorePhotos.mutate([photo.id]);
                setViewerIndex(null);
              }}
              aria-label="Unarchive"
            >
              <RiArrowGoBackLine className="size-4" />
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
