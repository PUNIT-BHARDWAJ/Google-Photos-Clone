"use client";

import { useEffect, useState } from "react";
import { RiArrowLeftSLine, RiArrowRightSLine, RiCloseLine, RiMagicLine } from "@remixicon/react";
import { Info, Share2, Star } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AiEditDialog } from "@/components/photos/ai-edit-dialog";
import { PhotoInfoPanel } from "@/components/photos/photo-info-panel";
import { ShareDialog } from "@/components/sharing/share-dialog";
import { useToggleStar } from "@/hooks/use-photos";
import { formatPhotoDate, getPhotoDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Photo } from "@/lib/api";

// Shortcuts must never fire while the user is typing or driving a widget that
// owns its own arrow keys (select listboxes, menus, sliders, tabs, radios).
function isTypingTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || target.isContentEditable) return true;
  return (
    target.closest(
      '[role="listbox"], [role="menu"], [role="combobox"], [role="slider"], [role="tablist"], [role="radiogroup"]',
    ) !== null
  );
}

type PhotoViewerProps = {
  photos: Photo[];
  index: number | null;
  onOpenChange: (open: boolean) => void;
  onIndexChange: (index: number) => void;
  renderActions?: (photo: Photo) => React.ReactNode;
};

export function PhotoViewer({ photos, index, onOpenChange, onIndexChange, renderActions }: PhotoViewerProps) {
  const open = index !== null;
  const photo = index !== null ? photos[index] : null;
  const [aiEditOpen, setAiEditOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);
  const [infoPanelPhotoId, setInfoPanelPhotoId] = useState(photo?.id);
  const toggleStar = useToggleStar();

  // Info panel is per-photo state, so switching photos while it's open would
  // otherwise keep showing the previous photo's data underneath the sheet.
  if (photo?.id !== infoPanelPhotoId) {
    setInfoPanelPhotoId(photo?.id);
    setInfoOpen(false);
  }

  // The AI edit and share dialogs are modal over the viewer - arrow keys there
  // belong to their own controls, not to swapping the photo underneath them.
  const nestedDialogOpen = aiEditOpen || shareOpen;

  useEffect(() => {
    if (!open || nestedDialogOpen) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.ctrlKey || event.metaKey || event.altKey) return;
      if (isTypingTarget(event.target)) return;

      if (event.key === "ArrowLeft") onIndexChange(Math.max(0, (index ?? 0) - 1));
      if (event.key === "ArrowRight") onIndexChange(Math.min(photos.length - 1, (index ?? 0) + 1));
      if (event.key === "i" || event.key === "I") setInfoOpen((prev) => !prev);
    }

    // Capture phase: Base UI's dialog popup stops propagation of arrow keys
    // (its composite-navigation keys), so a bubbling window listener never
    // sees ArrowLeft/ArrowRight while focus is inside the viewer.
    window.addEventListener("keydown", handleKeyDown, true);
    return () => window.removeEventListener("keydown", handleKeyDown, true);
  }, [open, nestedDialogOpen, index, photos.length, onIndexChange]);

  if (!photo || index === null) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/* Explicit grid tracks, not the base dialog's implicit auto rows: an
          auto row sizes to its content, so a tall photo used to stretch the
          viewer past the viewport and push the action bar off-screen. The
          middle track is minmax(0, 1fr), so the stage always gets exactly the
          space left over. Below `sm` the actions move to a bottom bar, since
          nine icon buttons plus a file name don't fit one row at phone width. */}
      <DialogContent
        showCloseButton={false}
        className="inset-0 top-0 left-0 h-dvh max-h-dvh w-full max-w-none translate-x-0 translate-y-0 grid-cols-[minmax(0,1fr)] grid-rows-[auto_minmax(0,1fr)_auto] gap-0 overflow-hidden rounded-none border-0 bg-black/95 p-0 text-white shadow-none ring-0 sm:max-w-none sm:grid-cols-[minmax(0,1fr)_auto] sm:grid-rows-[auto_minmax(0,1fr)]"
      >
        <DialogTitle className="sr-only">{photo.fileName}</DialogTitle>

        <header className="col-start-1 row-start-1 flex min-w-0 items-center gap-2 px-3 py-3 sm:px-5">
          <Button
            variant="ghost"
            size="icon-sm"
            className="shrink-0 text-white hover:bg-white/10"
            onClick={() => onOpenChange(false)}
            aria-label="Close"
          >
            <RiCloseLine className="size-5" />
          </Button>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{photo.fileName}</p>
            <p className="truncate text-xs text-white/60">{formatPhotoDate(getPhotoDate(photo))}</p>
          </div>
        </header>

        <div
          role="toolbar"
          aria-label="Photo actions"
          className="col-start-1 row-start-3 flex items-center justify-around gap-1 overflow-x-auto border-t border-white/10 px-2 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] sm:col-start-2 sm:row-start-1 sm:justify-end sm:border-t-0 sm:px-5 sm:py-3"
        >
          <Button
            variant="ghost"
            size="icon-sm"
            className="text-white hover:bg-white/10"
            onClick={() => toggleStar.mutate(photo)}
            aria-label={photo.starred ? "Unstar photo" : "Star photo"}
          >
            <Star className={cn("size-4", photo.starred ? "fill-amber-400 text-amber-400" : undefined)} />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            className="text-white hover:bg-white/10"
            onClick={() => setAiEditOpen(true)}
            aria-label="AI edit"
          >
            <RiMagicLine className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            className="text-white hover:bg-white/10"
            onClick={() => setShareOpen(true)}
            aria-label="Share"
          >
            <Share2 className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            className={cn("text-white hover:bg-white/10", infoOpen && "bg-white/10")}
            onClick={() => setInfoOpen((prev) => !prev)}
            aria-label="Photo info"
          >
            <Info className="size-4" />
          </Button>
          {renderActions?.(photo)}
        </div>

        <div className="relative col-start-1 row-start-2 min-h-0 overflow-hidden sm:col-span-2">
          {/* Absolutely filling the stage gives the image a definite box, so
              max-h-full/max-w-full always resolve and the photo scales down to
              fit instead of sizing the stage from its natural dimensions. */}
          <div className="absolute inset-0 flex items-center justify-center px-2 pb-2 sm:pb-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={photo.url}
              alt={photo.fileName}
              className="max-h-full max-w-full object-contain"
            />
          </div>

          {index > 0 && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute inset-y-0 left-2 z-10 my-auto rounded-full bg-black/30 text-white hover:bg-black/50 sm:left-4"
              onClick={() => onIndexChange(index - 1)}
              aria-label="Previous photo"
            >
              <RiArrowLeftSLine className="size-6" />
            </Button>
          )}

          {index < photos.length - 1 && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute inset-y-0 right-2 z-10 my-auto rounded-full bg-black/30 text-white hover:bg-black/50 sm:right-4"
              onClick={() => onIndexChange(index + 1)}
              aria-label="Next photo"
            >
              <RiArrowRightSLine className="size-6" />
            </Button>
          )}
        </div>
      </DialogContent>

      <AiEditDialog photo={photo} open={aiEditOpen} onOpenChange={setAiEditOpen} />
      <ShareDialog
        open={shareOpen}
        onOpenChange={setShareOpen}
        type="photo"
        targetId={photo.id}
        targetTitle={photo.fileName}
      />
      <PhotoInfoPanel photo={photo} open={infoOpen} onOpenChange={setInfoOpen} />
    </Dialog>
  );
}
