"use client";

import { useState } from "react";
import { RiCheckLine } from "@remixicon/react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { usePhotos } from "@/hooks/use-photos";
import { useAddPhotosToAlbum } from "@/hooks/use-albums";
import { cn } from "@/lib/utils";

type SelectPhotosDialogProps = {
  albumId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function SelectPhotosDialog({ albumId, open, onOpenChange }: SelectPhotosDialogProps) {
  const { data, isLoading, hasNextPage, fetchNextPage, isFetchingNextPage } = usePhotos("ACTIVE");
  const addPhotos = useAddPhotosToAlbum();
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const photos = data?.pages.flatMap((page) => page.content) ?? [];

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  async function handleAdd() {
    await addPhotos.mutateAsync({ albumId, photoIds: Array.from(selected) });
    setSelected(new Set());
    onOpenChange(false);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) setSelected(new Set());
        onOpenChange(next);
      }}
    >
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add photos</DialogTitle>
          <DialogDescription>Select photos from your library to add to this album</DialogDescription>
        </DialogHeader>

        <div className="-mx-1 max-h-[50vh] overflow-y-auto px-1">
          {isLoading && (
            <div className="flex justify-center py-10">
              <Spinner className="text-muted-foreground" />
            </div>
          )}

          {!isLoading && photos.length === 0 && (
            <p className="py-10 text-center text-sm text-muted-foreground">No photos in your library yet</p>
          )}

          <div className="grid grid-cols-4 gap-1.5 sm:grid-cols-5">
            {photos.map((photo) => {
              const isSelected = selected.has(photo.id);
              return (
                <button
                  key={photo.id}
                  type="button"
                  onClick={() => toggle(photo.id)}
                  className={cn(
                    "relative aspect-square overflow-hidden rounded-lg bg-muted",
                    isSelected && "ring-2 ring-primary ring-offset-2 ring-offset-popover",
                  )}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={photo.thumbnailUrl || photo.url}
                    alt={photo.fileName}
                    loading="lazy"
                    className={cn("h-full w-full object-cover", isSelected && "scale-95")}
                  />
                  {isSelected && (
                    <span className="absolute right-1 top-1 flex size-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                      <RiCheckLine className="size-3.5" />
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {hasNextPage && (
            <div className="flex justify-center py-4">
              <Button variant="outline" size="sm" onClick={() => fetchNextPage()} disabled={isFetchingNextPage}>
                {isFetchingNextPage ? <Spinner /> : "Load more"}
              </Button>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button onClick={handleAdd} disabled={selected.size === 0 || addPhotos.isPending}>
            {addPhotos.isPending ? (
              <Spinner />
            ) : (
              `Add ${selected.size || ""} photo${selected.size === 1 ? "" : "s"}`
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
