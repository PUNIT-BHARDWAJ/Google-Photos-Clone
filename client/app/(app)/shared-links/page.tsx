"use client";

import { useState } from "react";
import { toast } from "sonner";
import { RiFileCopyLine, RiFolderImageLine, RiImageLine, RiLinksLine } from "@remixicon/react";
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
import { ErrorState } from "@/components/layout/error-state";
import { useRevokeSharedLink, useSharedLinks } from "@/hooks/use-shared-links";
import { formatPhotoDate } from "@/lib/format";
import type { SharedLink } from "@/lib/api";

export default function SharedLinksPage() {
  const { data: links, isLoading, isError, error, refetch, isRefetching } = useSharedLinks();
  const revokeLink = useRevokeSharedLink();
  const [revokeTarget, setRevokeTarget] = useState<SharedLink | null>(null);

  async function handleCopy(url: string) {
    await navigator.clipboard.writeText(url);
    toast.success("Link copied to clipboard!");
  }

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
              className="flex items-center gap-3 rounded-2xl border border-border/60 bg-card px-3 py-2.5"
            >
              <div className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-muted">
                {link.targetThumbnailUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={link.targetThumbnailUrl} alt={link.targetTitle} className="h-full w-full object-cover" />
                ) : link.targetType === "ALBUM" ? (
                  <RiFolderImageLine className="size-5 text-muted-foreground" />
                ) : (
                  <RiImageLine className="size-5 text-muted-foreground" />
                )}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate text-sm font-medium text-foreground">{link.targetTitle}</p>
                  <Badge variant="outline">{link.targetType === "ALBUM" ? "Album" : "Photo"}</Badge>
                </div>
                <p className="truncate text-xs text-muted-foreground">
                  Created {formatPhotoDate(link.createdAt)} &middot;{" "}
                  {link.expiresAt ? `Expires ${formatPhotoDate(link.expiresAt)}` : "Never expires"}
                </p>
              </div>

              <div className="flex shrink-0 items-center gap-1.5">
                <Button
                  variant="outline"
                  size="icon-sm"
                  onClick={() => handleCopy(link.url)}
                  aria-label="Copy link"
                >
                  <RiFileCopyLine className="size-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                  onClick={() => setRevokeTarget(link)}
                >
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
