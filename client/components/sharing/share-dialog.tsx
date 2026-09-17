"use client";

import { useState } from "react";
import { toast } from "sonner";
import { RiFileCopyLine } from "@remixicon/react";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import {
  useCreateAlbumShare,
  useCreatePhotoShare,
  useRevokeSharedLink,
  useSharedLinks,
} from "@/hooks/use-shared-links";
import type { SharedLink } from "@/lib/api";

type ShareDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: "photo" | "album";
  targetId: string;
  targetTitle: string;
};

const EXPIRY_OPTIONS = [
  { value: "never", label: "Never expires" },
  { value: "1", label: "1 day" },
  { value: "7", label: "7 days" },
  { value: "30", label: "30 days" },
];

export function ShareDialog({ open, onOpenChange, type, targetId, targetTitle }: ShareDialogProps) {
  const [expiry, setExpiry] = useState("never");
  const [revokeConfirmOpen, setRevokeConfirmOpen] = useState(false);
  const [createdLink, setCreatedLink] = useState<SharedLink | null>(null);

  const { data: links } = useSharedLinks();
  const createPhotoShare = useCreatePhotoShare();
  const createAlbumShare = useCreateAlbumShare();
  const revokeLink = useRevokeSharedLink();

  const targetType = type === "photo" ? "PHOTO" : "ALBUM";
  const existingLink =
    createdLink ?? links?.find((link) => link.targetType === targetType && link.targetId === targetId) ?? null;
  const creating = createPhotoShare.isPending || createAlbumShare.isPending;

  function handleCreate() {
    const expiryDays = expiry === "never" ? undefined : Number(expiry);
    if (type === "photo") {
      createPhotoShare.mutate({ photoId: targetId, expiryDays }, { onSuccess: setCreatedLink });
    } else {
      createAlbumShare.mutate({ albumId: targetId, expiryDays }, { onSuccess: setCreatedLink });
    }
  }

  async function handleCopy() {
    if (!existingLink) return;
    await navigator.clipboard.writeText(existingLink.url);
    toast.success("Link copied to clipboard!");
  }

  function handleRevoke() {
    if (!existingLink) return;
    revokeLink.mutate(existingLink.id, {
      onSuccess: () => {
        setCreatedLink(null);
        setRevokeConfirmOpen(false);
        onOpenChange(false);
      },
    });
  }

  return (
    <>
      <Dialog
        open={open}
        onOpenChange={(next) => {
          if (!next) setCreatedLink(null);
          onOpenChange(next);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{type === "photo" ? "Share Photo" : "Share Album"}</DialogTitle>
            <DialogDescription>
              Anyone with the link can view &ldquo;{targetTitle}&rdquo; without signing in
            </DialogDescription>
          </DialogHeader>

          {existingLink ? (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                {createdLink ? "Link created" : "Link already exists"}
              </p>
              <div className="flex items-center gap-2">
                <Input value={existingLink.url} readOnly onFocus={(event) => event.target.select()} />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={handleCopy}
                  aria-label="Copy link"
                >
                  <RiFileCopyLine className="size-4" />
                </Button>
              </div>
            </div>
          ) : (
            <Field>
              <FieldLabel>Expiry</FieldLabel>
              <Select items={EXPIRY_OPTIONS} value={expiry} onValueChange={(value) => value && setExpiry(value)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {EXPIRY_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          )}

          <DialogFooter>
            {existingLink ? (
              <Button
                type="button"
                variant="ghost"
                className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                onClick={() => setRevokeConfirmOpen(true)}
              >
                Revoke link
              </Button>
            ) : (
              <Button type="button" onClick={handleCreate} disabled={creating}>
                {creating ? <Spinner /> : "Create Link"}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={revokeConfirmOpen} onOpenChange={setRevokeConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revoke this link?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure? Anyone with this link will lose access.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={handleRevoke} disabled={revokeLink.isPending}>
              {revokeLink.isPending ? <Spinner /> : "Revoke"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
