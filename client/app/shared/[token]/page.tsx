"use client";

import { useEffect } from "react";
import { useParams } from "next/navigation";
import { RiErrorWarningLine, RiTimeLine } from "@remixicon/react";
import { Spinner } from "@/components/ui/spinner";
import { useSharedAlbum, useSharedPhoto } from "@/hooks/use-shared-links";
import { isNetworkError, type PublicAlbum, type PublicPhoto } from "@/lib/api";
import { getSquareThumbnailSrc } from "@/lib/imagekit";

function isExpiredError(error: unknown) {
  return error instanceof Error && error.message === "This link has expired";
}

function Footer() {
  return (
    <footer className="border-t border-border px-4 py-4 text-center text-xs text-muted-foreground">
      Powered by Google Photos Clone
    </footer>
  );
}

function SharedStateMessage({
  icon,
  title,
  description,
  action,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <div className="flex flex-1 flex-col items-center justify-center gap-3 px-4 text-center">
        <div className="flex size-16 items-center justify-center rounded-full bg-muted text-muted-foreground">
          {icon}
        </div>
        <h1 className="text-lg font-medium">{title}</h1>
        <p className="text-sm text-muted-foreground">{description}</p>
        {action}
      </div>
      <Footer />
    </div>
  );
}

function SharedPhotoView({ photo }: { photo: PublicPhoto }) {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <div className="flex flex-1 items-center justify-center overflow-hidden p-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={photo.url} alt={photo.fileName} className="max-h-full max-w-full rounded-lg object-contain ring-1 ring-foreground/10" />
      </div>
      <p className="px-4 pb-2 text-center text-sm text-muted-foreground">{photo.fileName}</p>
      <Footer />
    </div>
  );
}

function SharedAlbumView({ album }: { album: PublicAlbum }) {
  // The segment layout's static title says "Shared Photo" - one token can be
  // either kind, which is only known once this data has loaded.
  useEffect(() => {
    document.title = `${album.title} — Shared Album — Google Photos Clone`;
  }, [album.title]);

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <header className="px-4 py-6 text-center">
        <h1 className="text-xl font-semibold">{album.title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {album.photos.length} item{album.photos.length === 1 ? "" : "s"}
        </p>
      </header>
      <div className="flex-1 px-2 pb-6">
        <div className="grid grid-cols-2 gap-1 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {album.photos.map((photo, index) => (
            <div key={index} className="aspect-square overflow-hidden rounded-lg bg-muted ring-1 ring-foreground/10">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={getSquareThumbnailSrc(photo.thumbnailUrl || photo.url)}
                alt={photo.fileName}
                loading="lazy"
                className="h-full w-full object-cover"
              />
            </div>
          ))}
        </div>
      </div>
      <Footer />
    </div>
  );
}

export default function SharedTokenPage() {
  const { token } = useParams<{ token: string }>();
  const photoQuery = useSharedPhoto(token);
  // Only a real "not a photo token" answer means it may be an album token - a
  // network failure says nothing about which kind of link this is.
  const tryAlbum =
    photoQuery.isError && !isExpiredError(photoQuery.error) && !isNetworkError(photoQuery.error);
  const albumQuery = useSharedAlbum(token, tryAlbum);

  const loading = photoQuery.isLoading || (tryAlbum && albumQuery.isLoading);
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Spinner className="size-6 text-muted-foreground" />
      </div>
    );
  }

  if (isNetworkError(photoQuery.error) || isNetworkError(albumQuery.error)) {
    return (
      <SharedStateMessage
        icon={<RiErrorWarningLine className="size-7" />}
        title="Something went wrong"
        description="We couldn't reach the server. Check your connection and try again."
        action={
          <button
            type="button"
            onClick={() => {
              photoQuery.refetch();
              if (albumQuery.isError) albumQuery.refetch();
            }}
            className="mt-2 rounded-full border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Try again
          </button>
        }
      />
    );
  }

  if (isExpiredError(photoQuery.error) || isExpiredError(albumQuery.error)) {
    return (
      <SharedStateMessage
        icon={<RiTimeLine className="size-7" />}
        title="This link has expired"
        description="Ask the owner to share a new link."
      />
    );
  }

  if (photoQuery.data) {
    return <SharedPhotoView photo={photoQuery.data} />;
  }

  if (albumQuery.data) {
    return <SharedAlbumView album={albumQuery.data} />;
  }

  return (
    <SharedStateMessage
      icon={<RiErrorWarningLine className="size-7" />}
      title="Link not found"
      description="This link may have been revoked or never existed."
    />
  );
}
