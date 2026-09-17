"use client";

import { useState } from "react";
import { RiArchive2Line, RiArrowGoBackLine, RiDeleteBinLine, RiDownloadLine, RiFolderAddLine } from "@remixicon/react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { ErrorState } from "@/components/layout/error-state";
import { PhotoGrid } from "@/components/photos/photo-grid";
import { PhotoGridSkeleton } from "@/components/photos/photo-grid-skeleton";
import { PhotoViewer } from "@/components/photos/photo-viewer";
import { SelectionAction, SelectionToolbar } from "@/components/photos/selection-toolbar";
import { AddToAlbumDialog } from "@/components/photos/add-to-album-dialog";
import { usePhotos, useRestorePhotos, useTrashPhotos } from "@/hooks/use-photos";
import { useSelection } from "@/hooks/use-selection";
import type { Photo } from "@/lib/api";

export default function ArchivePage() {
  const { data, isLoading, isError, error, refetch, isRefetching, hasNextPage, fetchNextPage, isFetchingNextPage } = usePhotos("ARCHIVE");
  const selection = useSelection();
  const restorePhotos = useRestorePhotos();
  const trashPhotos = useTrashPhotos();
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);
  const [addToAlbumOpen, setAddToAlbumOpen] = useState(false);

  const photos = data?.pages.flatMap((page) => page.content) ?? [];

  function handleOpen(photo: Photo) {
    const index = photos.findIndex((item) => item.id === photo.id);
    setViewerIndex(index === -1 ? null : index);
  }

  if (isLoading) {
    return <PhotoGridSkeleton />;
  }

  return (
    <div>
      {selection.isActive ? (
        <SelectionToolbar
          count={selection.count}
          onClear={selection.clear}
          actions={
            <>
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
        />
      ) : (
        <div className="mb-6">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Archive</h1>
          <p className="text-sm text-muted-foreground">Photos hidden from your main library</p>
        </div>
      )}

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
        <PhotoGrid
          photos={photos}
          selectedIds={selection.selectedIds}
          selectionActive={selection.isActive}
          onToggleSelect={selection.toggle}
          onOpen={handleOpen}
          hasNextPage={hasNextPage}
          isFetchingNextPage={isFetchingNextPage}
          onLoadMore={fetchNextPage}
        />
      )}

      <PhotoViewer
        photos={photos}
        index={viewerIndex}
        onOpenChange={(open) => !open && setViewerIndex(null)}
        onIndexChange={setViewerIndex}
        renderActions={(photo) => (
          <>
            <a
              href={photo.url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Open original"
              className={buttonVariants({ variant: "ghost", size: "icon-sm", className: "text-white hover:bg-white/10" })}
            >
              <RiDownloadLine className="size-4" />
            </a>
            <Button
              variant="ghost"
              size="icon-sm"
              className="text-white hover:bg-white/10"
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
              className="text-white hover:bg-white/10"
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
              className="text-white hover:bg-white/10"
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
