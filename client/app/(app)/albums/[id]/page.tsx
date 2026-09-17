"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  RiArrowLeftLine,
  RiDownloadLine,
  RiFolderImageLine,
  RiImageAddLine,
  RiImageCircleFill,
  RiSubtractLine,
} from "@remixicon/react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { ErrorState } from "@/components/layout/error-state";
import { PhotoGrid } from "@/components/photos/photo-grid";
import { PhotoGridSkeleton } from "@/components/photos/photo-grid-skeleton";
import { PhotoViewer } from "@/components/photos/photo-viewer";
import { SelectionAction, SelectionToolbar } from "@/components/photos/selection-toolbar";
import { AlbumActionsMenu } from "@/components/albums/album-actions-menu";
import { PhotoTileMenu } from "@/components/albums/photo-tile-menu";
import { SelectPhotosDialog } from "@/components/albums/select-photos-dialog";
import { useAlbum, useAlbumPhotos, useRemovePhotoFromAlbum, useUpdateAlbum } from "@/hooks/use-albums";
import { useSelection } from "@/hooks/use-selection";
import { isNetworkError, type Photo } from "@/lib/api";

export default function AlbumDetailPage() {
  const { id } = useParams<{ id: string }>();
  const {
    data: album,
    isLoading: isAlbumLoading,
    isError: isAlbumError,
    error: albumError,
    refetch: refetchAlbum,
    isRefetching: isAlbumRefetching,
  } = useAlbum(id);
  const { data, isLoading, isError, error, refetch, isRefetching, hasNextPage, fetchNextPage, isFetchingNextPage } = useAlbumPhotos(id);
  const selection = useSelection();
  const removePhoto = useRemovePhotoFromAlbum();
  const updateAlbum = useUpdateAlbum();
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);
  const [addPhotosOpen, setAddPhotosOpen] = useState(false);

  const photos = data?.pages.flatMap((page) => page.content) ?? [];
  const coverPhotoId = album?.coverPhotoId;
  // Stable across renders (the grid is memoized); only a cover change or a
  // different album gives the tiles a new menu.
  const renderTileMenu = useCallback(
    (photo: Photo) => <PhotoTileMenu photo={photo} albumId={id} isCover={photo.id === coverPhotoId} />,
    [id, coverPhotoId],
  );

  function handleOpen(photo: Photo) {
    const index = photos.findIndex((item) => item.id === photo.id);
    setViewerIndex(index === -1 ? null : index);
  }

  function handleRemoveMany(photoIds: string[]) {
    photoIds.forEach((photoId) => removePhoto.mutate({ albumId: id, photoId }));
    selection.clear();
  }

  if (isAlbumLoading || isLoading) {
    return <PhotoGridSkeleton />;
  }

  // A dropped connection isn't a missing album - only a real server answer
  // (404, malformed id) gets the "not found" state.
  if (isAlbumError && isNetworkError(albumError)) {
    return <ErrorState error={albumError} onRetry={() => refetchAlbum()} retrying={isAlbumRefetching} />;
  }

  if (isAlbumError || !album) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <RiFolderImageLine />
          </EmptyMedia>
          <EmptyTitle>Album not found</EmptyTitle>
          <EmptyDescription>This album may have been deleted</EmptyDescription>
        </EmptyHeader>
        <Link href="/albums" className={buttonVariants({ variant: "outline" })}>
          Back to albums
        </Link>
      </Empty>
    );
  }

  return (
    <div>
      {selection.isActive ? (
        <SelectionToolbar
          count={selection.count}
          onClear={selection.clear}
          actions={
            <SelectionAction
              variant="destructive"
              icon={<RiSubtractLine />}
              label="Remove from album"
              onClick={() => handleRemoveMany(selection.ids)}
            />
          }
        />
      ) : (
        <div className="mb-6 flex items-start justify-between gap-3">
          <div className="flex items-start gap-2">
            <Link
              href="/albums"
              className={buttonVariants({ variant: "ghost", size: "icon-sm", className: "mt-0.5 shrink-0" })}
              aria-label="Back to albums"
            >
              <RiArrowLeftLine className="size-4" />
            </Link>
            <div className="min-w-0">
              <h1 className="truncate text-2xl font-semibold tracking-tight text-foreground">{album.title}</h1>
              <p className="text-sm text-muted-foreground">
                {album.photoCount} item{album.photoCount === 1 ? "" : "s"}
              </p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Button variant="outline" onClick={() => setAddPhotosOpen(true)}>
              <RiImageAddLine />
              Add photos
            </Button>
            <AlbumActionsMenu album={album} />
          </div>
        </div>
      )}

      {isError && photos.length === 0 ? (
        <ErrorState error={error} onRetry={() => refetch()} retrying={isRefetching} />
      ) : photos.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <RiImageAddLine />
            </EmptyMedia>
            <EmptyTitle>This album is empty</EmptyTitle>
            <EmptyDescription>Add photos from your library to this album</EmptyDescription>
          </EmptyHeader>
          <Button onClick={() => setAddPhotosOpen(true)}>
            <RiImageAddLine />
            Add photos
          </Button>
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
          renderTileMenu={renderTileMenu}
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
              disabled={photo.id === album.coverPhotoId}
              onClick={() => updateAlbum.mutate({ id, coverPhotoId: photo.id })}
              aria-label="Set as album cover"
            >
              <RiImageCircleFill className="size-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              className="text-white hover:bg-white/10"
              onClick={() => {
                removePhoto.mutate({ albumId: id, photoId: photo.id });
                setViewerIndex(null);
              }}
              aria-label="Remove from album"
            >
              <RiSubtractLine className="size-4" />
            </Button>
          </>
        )}
      />

      <SelectPhotosDialog albumId={id} open={addPhotosOpen} onOpenChange={setAddPhotosOpen} />
    </div>
  );
}
