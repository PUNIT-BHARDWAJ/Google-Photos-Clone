"use client";

import { useState } from "react";
import { RiDeleteBinLine, RiMoreLine, RiPencilLine, RiShareLine } from "@remixicon/react";
import { ShareDialog } from "@/components/sharing/share-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { useDeleteAlbum, useUpdateAlbum } from "@/hooks/use-albums";
import type { Album } from "@/lib/api";

export function AlbumActionsMenu({ album }: { album: Album }) {
  const [renameOpen, setRenameOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [title, setTitle] = useState(album.title);
  const updateAlbum = useUpdateAlbum();
  const deleteAlbum = useDeleteAlbum();

  function handleRename(event: React.FormEvent) {
    event.preventDefault();
    const trimmed = title.trim();
    if (!trimmed || trimmed === album.title) {
      setRenameOpen(false);
      return;
    }
    updateAlbum.mutate({ id: album.id, title: trimmed }, { onSuccess: () => setRenameOpen(false) });
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger render={<Button variant="outline" size="icon" aria-label="Album options" />}>
          <RiMoreLine />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            onClick={() => {
              setTitle(album.title);
              setRenameOpen(true);
            }}
          >
            <RiPencilLine />
            Rename album
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setShareOpen(true)}>
            <RiShareLine />
            Share album
          </DropdownMenuItem>
          <DropdownMenuItem variant="destructive" onClick={() => setDeleteOpen(true)}>
            <RiDeleteBinLine />
            Delete album
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={renameOpen} onOpenChange={setRenameOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename album</DialogTitle>
            <DialogDescription>Choose a new name for this album</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleRename} className="space-y-6">
            <Field>
              <FieldLabel htmlFor="rename-album-title">Album name</FieldLabel>
              <Input
                id="rename-album-title"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                autoFocus
              />
            </Field>
            <DialogFooter>
              <Button type="submit" disabled={!title.trim() || updateAlbum.isPending}>
                {updateAlbum.isPending ? <Spinner /> : "Save"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete album?</AlertDialogTitle>
            <AlertDialogDescription>
              &ldquo;{album.title}&rdquo; will be deleted. Photos inside it stay in your library.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => deleteAlbum.mutate(album.id)}
              disabled={deleteAlbum.isPending}
            >
              {deleteAlbum.isPending ? <Spinner /> : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <ShareDialog
        open={shareOpen}
        onOpenChange={setShareOpen}
        type="album"
        targetId={album.id}
        targetTitle={album.title}
      />
    </>
  );
}
