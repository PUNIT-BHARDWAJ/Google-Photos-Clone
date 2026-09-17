"use client";

import { useState } from "react";
import { RiFolderImageLine, RiImageLine, RiLinksLine } from "@remixicon/react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Spinner } from "@/components/ui/spinner";
import { CopyLinkButton } from "@/components/sharing/copy-link-button";
import { ErrorState } from "@/components/layout/error-state";
import { useRevokeSharedLink, useSharedLinks } from "@/hooks/use-shared-links";
import { formatPhotoDate } from "@/lib/format";
import { getSquareThumbnailSrc } from "@/lib/imagekit";
import type { SharedLink } from "@/lib/api";

export default function SharedLinksPage() {
  const { data: links, isLoading, isError, error, refetch, isRefetching } = useSharedLinks();
  const revokeLink = useRevokeSharedLink();
  const [revokeTarget, setRevokeTarget] = useState<SharedLink | null>(null);

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Spinner className="size-6 text-muted-foreground" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Shared links</h1>
        <p className="text-sm text-muted-foreground">Photos and albums you&apos;ve shared publicly</p>
      </div>

      {isError && !links ? (
        <ErrorState error={error} onRetry={() => refetch()} retrying={isRefetching} />
      ) : !links || links.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <RiLinksLine />
            </EmptyMedia>
            <EmptyTitle>No shared links yet</EmptyTitle>
            <EmptyDescription>
              Share a photo or album to create a public link that anyone can view
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <div className="space-y-2">
          {links.map((link) => (
            <div
              key={link.id}
              className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-2xl border border-border bg-card px-3 py-2.5"
            >
              <div className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-muted">
                {link.targetThumbnailUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={getSquareThumbnailSrc(link.targetThumbnailUrl, 96)} alt={link.targetTitle} className="h-full w-full object-cover" />
                ) : link.targetType === "ALBUM" ? (
                  <RiFolderImageLine className="size-5 text-muted-foreground" />
                ) : (
                  <RiImageLine className="size-5 text-muted-foreground" />
                )}
              </div>

              {/* Title on its own line; the badges and date wrap beneath it, and
                  the row wraps the copy/revoke buttons onto their own line when
                  a phone is too narrow for both, instead of squeezing the title
                  away. */}
              <div className="min-w-40 flex-1 space-y-1">
                <a
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block truncate text-sm font-medium text-primary hover:underline"
                >
                  {link.targetTitle}
                </a>
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <Badge variant="outline">{link.targetType === "ALBUM" ? "Album" : "Photo"}</Badge>
                  {/* The list only contains live links (expired ones are
                      filtered server-side), so the status is about expiry. */}
                  {link.expiresAt ? (
                    <Badge className="bg-amber-500/15 text-amber-800 dark:bg-amber-400/15 dark:text-amber-300">
                      Expires {formatPhotoDate(link.expiresAt)}
                    </Badge>
                  ) : (
                    <Badge variant="secondary">No expiry</Badge>
                  )}
                  <span className="text-xs text-muted-foreground">Created {formatPhotoDate(link.createdAt)}</span>
                </div>
              </div>

              <div className="ml-auto flex shrink-0 items-center gap-1.5">
                <CopyLinkButton url={link.url} size="sm" />

                <Button variant="destructive" size="sm" onClick={() => setRevokeTarget(link)}>
                  Revoke
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <AlertDialog open={!!revokeTarget} onOpenChange={(open) => !open && setRevokeTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revoke this link?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure? Anyone with this link will lose access.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={revokeLink.isPending}
              onClick={() => {
                if (!revokeTarget) return;
                revokeLink.mutate(revokeTarget.id, { onSuccess: () => setRevokeTarget(null) });
              }}
            >
              {revokeLink.isPending ? <Spinner /> : "Revoke"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
