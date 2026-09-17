"use client";

import { useState } from "react";
import Link from "next/link";
import { RiFolderImageLine } from "@remixicon/react";
import { Share2 } from "lucide-react";
import { ShareDialog } from "@/components/sharing/share-dialog";
import { getSquareThumbnailSrc } from "@/lib/imagekit";
import type { Album } from "@/lib/api";

type AlbumCardProps = {
  album: Album;
};

export function AlbumCard({ album }: AlbumCardProps) {
  const [shareOpen, setShareOpen] = useState(false);

  return (
    <div className="group/album relative">
      <Link href={`/albums/${album.id}`} className="block space-y-2">
        <div className="aspect-square overflow-hidden rounded-2xl bg-muted dark:ring-1 dark:ring-foreground/10">
          {album.coverThumbnailUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={getSquareThumbnailSrc(album.coverThumbnailUrl)}
              alt={album.title}
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-200 group-hover/album:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <RiFolderImageLine className="size-8 text-muted-foreground" />
            </div>
          )}
        </div>
        <div className="min-w-0 px-0.5">
          <p className="truncate text-sm font-medium text-foreground">{album.title}</p>
          <p className="text-xs text-muted-foreground">
            {album.photoCount} item{album.photoCount === 1 ? "" : "s"}
          </p>
        </div>
      </Link>

      <button
        type="button"
        aria-label="Share album"
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          setShareOpen(true);
        }}
        className="absolute right-2 top-2 flex size-7 items-center justify-center rounded-full bg-black/40 text-white opacity-100 shadow-sm backdrop-blur-sm transition-opacity hover:bg-black/60 sm:opacity-0 sm:group-hover/album:opacity-100"
      >
        <Share2 className="size-3.5" />
      </button>

      <ShareDialog
        open={shareOpen}
        onOpenChange={setShareOpen}
        type="album"
        targetId={album.id}
        targetTitle={album.title}
      />
    </div>
  );
}
