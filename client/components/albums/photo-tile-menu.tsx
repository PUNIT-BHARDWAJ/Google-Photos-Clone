"use client";

import { RiImageCircleFill, RiMoreLine, RiSubtractLine } from "@remixicon/react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useRemovePhotoFromAlbum, useUpdateAlbum } from "@/hooks/use-albums";
import type { Photo } from "@/lib/api";

type PhotoTileMenuProps = {
  photo: Photo;
  albumId: string;
  isCover: boolean;
};

export function PhotoTileMenu({ photo, albumId, isCover }: PhotoTileMenuProps) {
  const updateAlbum = useUpdateAlbum();
  const removePhoto = useRemovePhotoFromAlbum();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="icon-sm"
            className="bg-black/40 text-white hover:bg-black/60"
            aria-label="Photo options"
          />
        }
      >
        <RiMoreLine className="size-3.5" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          disabled={isCover}
          onClick={() => updateAlbum.mutate({ id: albumId, coverPhotoId: photo.id })}
        >
          <RiImageCircleFill />
          {isCover ? "Already the cover" : "Set as album cover"}
        </DropdownMenuItem>
        <DropdownMenuItem
          variant="destructive"
          onClick={() => removePhoto.mutate({ albumId, photoId: photo.id })}
        >
          <RiSubtractLine />
          Remove from album
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
