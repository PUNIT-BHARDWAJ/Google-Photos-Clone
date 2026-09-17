"use client";

import { useState } from "react";
import { RiAddLine, RiFolderImageLine } from "@remixicon/react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { useAddPhotosToAlbum, useAlbums, useCreateAlbum } from "@/hooks/use-albums";

type AddToAlbumDialogProps = {
  photoIds: string[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDone?: () => void;
};

export function AddToAlbumDialog({ photoIds, open, onOpenChange, onDone }: AddToAlbumDialogProps) {
  const { data: albums, isLoading } = useAlbums();
  const createAlbum = useCreateAlbum();
  const addPhotos = useAddPhotosToAlbum();
  const [newTitle, setNewTitle] = useState("");
  const [addingId, setAddingId] = useState<string | null>(null);

  async function handleAdd(albumId: string) {
    setAddingId(albumId);
    try {
      await addPhotos.mutateAsync({ albumId, photoIds });
      onOpenChange(false);
      onDone?.();
    } finally {
      setAddingId(null);
    }
  }

  async function handleCreateAndAdd() {
    const title = newTitle.trim();
    if (!title) return;
    const album = await createAlbum.mutateAsync(title);
    setNewTitle("");
    await handleAdd(album.id);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add to album</DialogTitle>
          <DialogDescription>
            {photoIds.length} photo{photoIds.length === 1 ? "" : "s"} selected
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={(event) => {
            event.preventDefault();
            handleCreateAndAdd();
          }}
          className="flex gap-2"
        >
          <Input
            placeholder="New album name"
            value={newTitle}
            onChange={(event) => setNewTitle(event.target.value)}
          />
          <Button
            type="submit"
            size="icon"
            variant="outline"
            disabled={!newTitle.trim() || createAlbum.isPending}
            aria-label="Create album"
          >
            {createAlbum.isPending ? <Spinner /> : <RiAddLine />}
          </Button>
        </form>

        <div className="-mx-1 max-h-80 space-y-1 overflow-y-auto px-1">
          {isLoading && (
            <div className="flex justify-center py-6">
              <Spinner className="text-muted-foreground" />
            </div>
          )}

          {!isLoading && albums?.length === 0 && (
            <p className="py-6 text-center text-sm text-muted-foreground">No albums yet</p>
          )}

          {albums?.map((album) => (
            <button
              key={album.id}
              type="button"
              onClick={() => handleAdd(album.id)}
              disabled={addingId === album.id}
              className="flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left hover:bg-muted disabled:opacity-60"
            >
              <div className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-muted">
                {album.coverThumbnailUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={album.coverThumbnailUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  <RiFolderImageLine className="size-5 text-muted-foreground" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{album.title}</p>
                <p className="text-xs text-muted-foreground">{album.photoCount} items</p>
              </div>
              {addingId === album.id && <Spinner className="size-4" />}
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
