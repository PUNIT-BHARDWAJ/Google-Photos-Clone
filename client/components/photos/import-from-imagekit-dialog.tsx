"use client";

import { useState } from "react";
import { RiCheckLine, RiDownloadCloud2Line } from "@remixicon/react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { useImageKitAssets, useImportAssets } from "@/hooks/use-library";
import { getSquareThumbnailSrc } from "@/lib/imagekit";
import { cn } from "@/lib/utils";

type ImportFromImageKitDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function ImportFromImageKitDialog({ open, onOpenChange }: ImportFromImageKitDialogProps) {
  const { data: assets, isLoading } = useImageKitAssets(open);
  const importAssets = useImportAssets();
  const [selected, setSelected] = useState<Set<string>>(new Set());

  function toggle(fileId: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(fileId)) {
        next.delete(fileId);
      } else {
        next.add(fileId);
      }
      return next;
    });
  }

  async function handleImport() {
    await importAssets.mutateAsync(Array.from(selected));
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
          <DialogTitle>Import from ImageKit</DialogTitle>
          <DialogDescription>
            Files already in your ImageKit storage that haven&apos;t been added to your library yet
          </DialogDescription>
        </DialogHeader>

        <div className="-mx-1 max-h-[50vh] overflow-y-auto px-1">
          {isLoading && (
            <div className="flex justify-center py-10">
              <Spinner className="text-muted-foreground" />
            </div>
          )}

          {!isLoading && (!assets || assets.length === 0) && (
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <RiDownloadCloud2Line />
                </EmptyMedia>
                <EmptyTitle>Nothing to import</EmptyTitle>
                <EmptyDescription>No assets were found in your ImageKit storage</EmptyDescription>
              </EmptyHeader>
            </Empty>
          )}

          <div className="grid grid-cols-4 gap-1.5 sm:grid-cols-5">
            {assets?.map((asset) => {
              const isSelected = selected.has(asset.fileId);
              return (
                <button
                  key={asset.fileId}
                  type="button"
                  disabled={asset.alreadyImported}
                  onClick={() => toggle(asset.fileId)}
                  className={cn(
                    "relative aspect-square overflow-hidden rounded-lg bg-muted disabled:opacity-40",
                    isSelected && "ring-2 ring-primary ring-offset-2 ring-offset-popover",
                  )}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={getSquareThumbnailSrc(asset.thumbnailUrl || asset.url, 240)}
                    alt={asset.fileName}
                    loading="lazy"
                    className={cn("h-full w-full object-cover", isSelected && "scale-95")}
                  />
                  {asset.alreadyImported && (
                    <Badge variant="secondary" className="absolute bottom-1 left-1 right-1 justify-center">
                      Added
                    </Badge>
                  )}
                  {isSelected && !asset.alreadyImported && (
                    <span className="absolute right-1 top-1 flex size-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                      <RiCheckLine className="size-3.5" />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <DialogFooter>
          <Button onClick={handleImport} disabled={selected.size === 0 || importAssets.isPending}>
            {importAssets.isPending ? (
              <Spinner />
            ) : (
              `Import ${selected.size || ""} photo${selected.size === 1 ? "" : "s"}`
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
