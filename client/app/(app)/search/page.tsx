"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { RiSearchLine } from "@remixicon/react";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { ErrorState } from "@/components/layout/error-state";
import { PhotoGrid } from "@/components/photos/photo-grid";
import { PhotoGridSkeleton } from "@/components/photos/photo-grid-skeleton";
import { PhotoViewer } from "@/components/photos/photo-viewer";
import { useSearchPhotos } from "@/hooks/use-photos";
import type { Photo } from "@/lib/api";

export default function SearchPage() {
  const searchParams = useSearchParams();
  const query = (searchParams.get("q") ?? "").trim();
  const { data, isLoading, isError, error, refetch, isRefetching, hasNextPage, fetchNextPage, isFetchingNextPage } = useSearchPhotos(query);
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);

  const photos = data?.pages.flatMap((page) => page.content) ?? [];
  const totalCount = data?.pages[0]?.totalElements ?? 0;

  function handleOpen(photo: Photo) {
    const index = photos.findIndex((item) => item.id === photo.id);
    setViewerIndex(index === -1 ? null : index);
  }

  if (!query) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <RiSearchLine />
          </EmptyMedia>
          <EmptyTitle>Search your photos</EmptyTitle>
          <EmptyDescription>Start typing in the search bar to find photos by file name</EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  if (isLoading) {
    return <PhotoGridSkeleton />;
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Results for &ldquo;{query}&rdquo;
        </h1>
        <p className="text-sm text-muted-foreground">
          {totalCount} photo{totalCount === 1 ? "" : "s"} found
        </p>
      </div>

      {isError && photos.length === 0 ? (
        <ErrorState error={error} onRetry={() => refetch()} retrying={isRefetching} />
      ) : photos.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <RiSearchLine />
            </EmptyMedia>
            <EmptyTitle>No photos match your search</EmptyTitle>
            <EmptyDescription>Try a different file name</EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <PhotoGrid
          photos={photos}
          selectedIds={new Set()}
          selectionActive={false}
          onToggleSelect={() => {}}
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
