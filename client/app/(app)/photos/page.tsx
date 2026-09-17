"use client";

import { useState } from "react";
import {
  RiArchiveLine,
  RiDeleteBinLine,
  RiDownloadLine,
  RiFolderAddLine,
  RiImageLine,
} from "@remixicon/react";
import { Star } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { ErrorState } from "@/components/layout/error-state";
import { PhotoGrid } from "@/components/photos/photo-grid";
import { PhotoGridSkeleton } from "@/components/photos/photo-grid-skeleton";
import { PhotoViewer } from "@/components/photos/photo-viewer";
import { SelectionAction, SelectionToolbar } from "@/components/photos/selection-toolbar";
import { AddPhotosMenu } from "@/components/photos/add-photos-menu";
import { AddToAlbumDialog } from "@/components/photos/add-to-album-dialog";
import { useBulkSetStarred, usePhotos, useArchivePhotos, useTrashPhotos } from "@/hooks/use-photos";
import { useSelection } from "@/hooks/use-selection";
import type { Photo } from "@/lib/api";

export default function PhotosPage() {
  const { data, isLoading, isError, error, refetch, isRefetching, hasNextPage, fetchNextPage, isFetchingNextPage } = usePhotos("ACTIVE");
  const selection = useSelection();
  const archivePhotos = useArchivePhotos();
  const trashPhotos = useTrashPhotos();
  const bulkSetStarred = useBulkSetStarred();
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);
  const [addToAlbumOpen, setAddToAlbumOpen] = useState(false);

  const photos = data?.pages.flatMap((page) => page.content) ?? [];
  const selectedPhotos = photos.filter((photo) => selection.selectedIds.has(photo.id));
  const allSelectedStarred = selectedPhotos.length > 0 && selectedPhotos.every((photo) => photo.starred);

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
        />
      ) : (
        <div className="mb-6 flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">Photos</h1>
            <p className="text-sm text-muted-foreground">All your memories, backed up automatically</p>
          </div>
          <AddPhotosMenu />
        </div>
      )}

      {isError && photos.length === 0 ? (
        <ErrorState error={error} onRetry={() => refetch()} retrying={isRefetching} />
      ) : photos.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <RiImageLine />
            </EmptyMedia>
            <EmptyTitle>No photos yet</EmptyTitle>
            <EmptyDescription>Upload your first photos to get started</EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <AddPhotosMenu />
          </EmptyContent>
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
              onClick={() => archivePhotos.mutate([photo.id])}
              aria-label="Archive"
            >
              <RiArchiveLine className="size-4" />
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
