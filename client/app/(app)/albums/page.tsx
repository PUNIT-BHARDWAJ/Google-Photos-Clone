"use client";

import { RiFolderImageLine } from "@remixicon/react";
import { Spinner } from "@/components/ui/spinner";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { AlbumGrid } from "@/components/albums/album-grid";
import { ErrorState } from "@/components/layout/error-state";
import { CreateAlbumDialog } from "@/components/albums/create-album-dialog";
import { useAlbums } from "@/hooks/use-albums";

export default function AlbumsPage() {
  const { data: albums, isLoading, isError, error, refetch, isRefetching } = useAlbums();

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Spinner className="size-6 text-muted-foreground" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Albums</h1>
          <p className="text-sm text-muted-foreground">Group photos together and share your favorite moments</p>
        </div>
        <CreateAlbumDialog />
      </div>

      {isError && !albums ? (
        <ErrorState error={error} onRetry={() => refetch()} retrying={isRefetching} />
      ) : !albums || albums.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <RiFolderImageLine />
            </EmptyMedia>
            <EmptyTitle>No albums yet</EmptyTitle>
            <EmptyDescription>Create an album to start organizing your photos</EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <CreateAlbumDialog />
          </EmptyContent>
        </Empty>
      ) : (
        <AlbumGrid albums={albums} />
      )}
    </div>
  );
}
