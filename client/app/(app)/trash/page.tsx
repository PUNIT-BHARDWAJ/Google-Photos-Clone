"use client";

import { useState } from "react";
import { RiArrowGoBackLine, RiDeleteBin2Line, RiDeleteBinLine, RiDownloadLine } from "@remixicon/react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { ErrorState } from "@/components/layout/error-state";
import { PhotoGrid } from "@/components/photos/photo-grid";
import { PhotoGridSkeleton } from "@/components/photos/photo-grid-skeleton";
import { PhotoViewer } from "@/components/photos/photo-viewer";
import { SelectionAction, SelectionToolbar } from "@/components/photos/selection-toolbar";
import { ConfirmDeleteForeverDialog } from "@/components/photos/confirm-delete-dialog";
import { useDeletePhotosForever, usePhotos, useRestorePhotos } from "@/hooks/use-photos";
import { useSelection } from "@/hooks/use-selection";
import type { Photo } from "@/lib/api";

export default function TrashPage() {
  const { data, isLoading, isError, error, refetch, isRefetching, hasNextPage, fetchNextPage, isFetchingNextPage } = usePhotos("TRASH");
  const selection = useSelection();
  const restorePhotos = useRestorePhotos();
  const deleteForever = useDeletePhotosForever();
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);
  const [confirmIds, setConfirmIds] = useState<string[] | null>(null);

  const photos = data?.pages.flatMap((page) => page.content) ?? [];

  function handleOpen(photo: Photo) {
    const index = photos.findIndex((item) => item.id === photo.id);
    setViewerIndex(index === -1 ? null : index);
  }

  function handleConfirmDelete() {
    if (!confirmIds) return;
    deleteForever.mutate(confirmIds, {
      onSuccess: () => {
        selection.clear();
        setViewerIndex(null);
      },
    });
    setConfirmIds(null);
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
                icon={<RiArrowGoBackLine />}
                label="Restore"
                onClick={() => restorePhotos.mutate(selection.ids, { onSuccess: selection.clear })}
                disabled={restorePhotos.isPending}
              />
              <SelectionAction
                variant="destructive"
                icon={<RiDeleteBin2Line />}
                label="Delete forever"
                onClick={() => setConfirmIds(selection.ids)}
              />
            </>
          }
        />
      ) : (
        <div className="mb-6 flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">Trash</h1>
            <p className="text-sm text-muted-foreground">
              Items in trash stay here until you restore or delete them permanently
            </p>
          </div>
          {photos.length > 0 && (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setConfirmIds(photos.map((photo) => photo.id))}
            >
              <RiDeleteBin2Line />
              Empty trash
            </Button>
          )}
        </div>
      )}

      {isError && photos.length === 0 ? (
        <ErrorState error={error} onRetry={() => refetch()} retrying={isRefetching} />
      ) : photos.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <RiDeleteBinLine />
            </EmptyMedia>
            <EmptyTitle>Trash is empty</EmptyTitle>
            <EmptyDescription>Deleted photos show up here before they&apos;re gone for good</EmptyDescription>
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
                restorePhotos.mutate([photo.id]);
                setViewerIndex(null);
              }}
              aria-label="Restore"
            >
              <RiArrowGoBackLine className="size-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              className="text-white hover:bg-white/10"
              onClick={() => setConfirmIds([photo.id])}
              aria-label="Delete forever"
            >
              <RiDeleteBin2Line className="size-4" />
            </Button>
          </>
        )}
      />

      <ConfirmDeleteForeverDialog
        open={confirmIds !== null}
        onOpenChange={(open) => !open && setConfirmIds(null)}
        count={confirmIds?.length ?? 0}
        onConfirm={handleConfirmDelete}
        pending={deleteForever.isPending}
      />
    </div>
  );
}
