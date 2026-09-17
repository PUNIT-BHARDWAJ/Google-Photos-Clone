"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { ErrorState } from "@/components/layout/error-state";
import { PhotoGrid } from "@/components/photos/photo-grid";
import { PhotoGridSkeleton } from "@/components/photos/photo-grid-skeleton";
import { PhotoViewer } from "@/components/photos/photo-viewer";
import { SelectionAction, SelectionToolbar } from "@/components/photos/selection-toolbar";
import { useBulkSetStarred, usePhotos } from "@/hooks/use-photos";
import { useSelection } from "@/hooks/use-selection";
import type { Photo } from "@/lib/api";

export default function FavoritesPage() {
  const { data, isLoading, isError, error, refetch, isRefetching, hasNextPage, fetchNextPage, isFetchingNextPage } = usePhotos("ACTIVE", true);
  const selection = useSelection();
  const bulkSetStarred = useBulkSetStarred();
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);

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
    <div>
      {selection.isActive ? (
        <SelectionToolbar
          count={selection.count}
          onClear={selection.clear}
          actions={
            <SelectionAction
              variant="outline"
              icon={<Star className="fill-amber-400 text-amber-400" />}
              label="Unstar"
              onClick={() =>
                bulkSetStarred.mutate(
                  { photos: selectedPhotos, starred: false },
                  { onSuccess: selection.clear },
                )
              }
              disabled={bulkSetStarred.isPending}
            />
          }
        />
      ) : (
        <div className="mb-6">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Favorites</h1>
          <p className="text-sm text-muted-foreground">Photos you&apos;ve starred</p>
        </div>
      )}

      {isError && photos.length === 0 ? (
        <ErrorState error={error} onRetry={() => refetch()} retrying={isRefetching} />
      ) : photos.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Star className="size-6" />
            </EmptyMedia>
            <EmptyTitle>No favorites yet</EmptyTitle>
            <EmptyDescription>Star photos to see them here</EmptyDescription>
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
      />
    </div>
  );
}
