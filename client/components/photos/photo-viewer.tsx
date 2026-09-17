"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, type Variants } from "framer-motion";
import { RiArrowLeftSLine, RiArrowRightSLine, RiCloseLine, RiMagicLine } from "@remixicon/react";
import { Info, Share2 } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AiEditDialog } from "@/components/photos/ai-edit-dialog";
import { AnimatedStar } from "@/components/photos/animated-star";
import { PhotoInfoPanel } from "@/components/photos/photo-info-panel";
import { ShareDialog } from "@/components/sharing/share-dialog";
import { useToggleStar } from "@/hooks/use-photos";
import { formatPhotoDate, getPhotoDate } from "@/lib/format";
import { getViewerPreviewSrc } from "@/lib/imagekit";
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

// Horizontal distance a swipe must travel (and dominate the vertical travel)
// before it counts as prev/next rather than a stray touch or a scroll.
const SWIPE_MIN_DISTANCE_PX = 50;
const SLIDE_OFFSET_PX = 300;

// direction: 1 = next (slides in from the right), -1 = previous.
// A raw `transform` rather than `x`: Framer Motion runs transform and opacity
// through WAAPI on the compositor, so the slide stays smooth even while the
// main thread is busy rendering the next photo. Independent transforms like
// `x` are driven from JavaScript every frame.
const slideVariants: Variants = {
  enter: (direction: number) => ({ transform: `translateX(${direction * SLIDE_OFFSET_PX}px)`, opacity: 0 }),
  center: { transform: "translateX(0px)", opacity: 1 },
  exit: (direction: number) => ({ transform: `translateX(${direction * -SLIDE_OFFSET_PX}px)`, opacity: 0 }),
};

/**
 * The photo at its fitted size. The box is sized from the photo's known
 * dimensions (contained in the stage via container-query units), so it's
 * correct before anything downloads: the cached grid rendition fills it
 * immediately, then the full-resolution original crossfades in over it.
 */
function ViewerImage({ photo }: { photo: Photo }) {
  const [loaded, setLoaded] = useState(false);
  const previewSrc = getViewerPreviewSrc(photo);
  const { width, height } = photo;

  if (!width || !height) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={photo.url} alt={photo.fileName} draggable={false} className="max-h-full max-w-full object-contain" />;
  }

  return (
    <div
      className="relative"
      style={{
        aspectRatio: `${width} / ${height}`,
        // Contain within the stage, and never upscale past the original.
        width: `min(100cqw, calc(100cqh * ${width / height}), ${width}px)`,
      }}
    >
      {previewSrc && !loaded && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={previewSrc}
          alt=""
          aria-hidden
          draggable={false}
          className="absolute inset-0 h-full w-full object-contain blur-[2px]"
        />
      )}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={photo.url}
        alt={photo.fileName}
        draggable={false}
        onLoad={() => setLoaded(true)}
        className={cn(
          "absolute inset-0 h-full w-full object-contain transition-opacity duration-300 ease-out",
          loaded ? "opacity-100" : "opacity-0",
        )}
      />
    </div>
  );
}

type PhotoViewerProps = {
  photos: Photo[];
  index: number | null;
  onOpenChange: (open: boolean) => void;
  onIndexChange: (index: number) => void;
  renderActions?: (photo: Photo) => React.ReactNode;
};

export function PhotoViewer({
  photos,
  index: requestedIndex,
  onOpenChange,
  onIndexChange,
  renderActions,
}: PhotoViewerProps) {
  const open = requestedIndex !== null;
  const requestedPhoto = requestedIndex !== null ? photos[requestedIndex] : null;

  // Pages close the viewer by clearing its index, which used to unmount the
  // dialog on the spot - no close animation could ever run. The last photo is
  // kept on screen until Base UI reports the exit animation finished
  // (onOpenChangeComplete), including one that was just deleted from here.
  const [retained, setRetained] = useState<{ photo: Photo; index: number } | null>(null);
  if (
    requestedPhoto &&
    requestedIndex !== null &&
    (retained?.photo !== requestedPhoto || retained.index !== requestedIndex)
  ) {
    setRetained({ photo: requestedPhoto, index: requestedIndex });
  }
  const shown = requestedPhoto && requestedIndex !== null ? { photo: requestedPhoto, index: requestedIndex } : retained;
  const photo = shown?.photo ?? null;
  const index = shown?.index ?? null;

  const [aiEditOpen, setAiEditOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);
  const [infoPanelPhotoId, setInfoPanelPhotoId] = useState(photo?.id);
  // Which way the last navigation went, so the outgoing photo leaves on the
  // opposite side from where the incoming one arrives.
  const [direction, setDirection] = useState(1);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const toggleStar = useToggleStar();

  // The one path for prev/next - keys, buttons and swipes all go through it,
  // so the slide direction always matches what happened.
  const navigate = useCallback(
    (step: 1 | -1) => {
      if (index === null) return;
      const next = index + step;
      if (next < 0 || next >= photos.length) return;
      setDirection(step);
      onIndexChange(next);
    },
    [index, photos.length, onIndexChange],
  );

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

      if (event.key === "ArrowLeft") navigate(-1);
      if (event.key === "ArrowRight") navigate(1);
      if (event.key === "i" || event.key === "I") setInfoOpen((prev) => !prev);
    }

    // Capture phase: Base UI's dialog popup stops propagation of arrow keys
    // (its composite-navigation keys), so a bubbling window listener never
    // sees ArrowLeft/ArrowRight while focus is inside the viewer.
    window.addEventListener("keydown", handleKeyDown, true);
    return () => window.removeEventListener("keydown", handleKeyDown, true);
  }, [open, nestedDialogOpen, navigate]);

  if (!photo || index === null) return null;

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      onOpenChangeComplete={(isOpen) => {
        if (!isOpen) setRetained(null);
      }}
    >
      {/* Explicit grid tracks, not the base dialog's implicit auto rows: an
          auto row sizes to its content, so a tall photo used to stretch the
          viewer past the viewport and push the action bar off-screen. The
          middle track is minmax(0, 1fr), so the stage always gets exactly the
          space left over. Below `sm` the actions move to a bottom bar, since
          nine icon buttons plus a file name don't fit one row at phone width. */}
      <DialogContent
        showCloseButton={false}
        // The backdrop and the viewer fade together over 200ms; the photo
        // stage adds its own scale-from-0.9 below.
        overlayClassName="duration-200"
        animationClassName="duration-200 ease-out data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0"
        className="group/viewer inset-0 top-0 left-0 h-dvh max-h-dvh w-full max-w-none translate-x-0 translate-y-0 grid-cols-[minmax(0,1fr)] grid-rows-[auto_minmax(0,1fr)_auto] gap-0 overflow-hidden rounded-none border-0 bg-black/95 p-0 text-white shadow-none ring-0 sm:max-w-none sm:grid-cols-[minmax(0,1fr)_auto] sm:grid-rows-[auto_minmax(0,1fr)]"
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
            <AnimatedStar starred={photo.starred} className="size-4" />
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

        <div
          className="relative col-start-1 row-start-2 min-h-0 touch-pan-y overflow-hidden duration-200 ease-out sm:col-span-2 group-data-[open]/viewer:animate-in group-data-[open]/viewer:zoom-in-90 group-data-[closed]/viewer:animate-out group-data-[closed]/viewer:zoom-out-90"
          onTouchStart={(event) => {
            const touch = event.touches[0];
            touchStartRef.current = { x: touch.clientX, y: touch.clientY };
          }}
          onTouchEnd={(event) => {
            const start = touchStartRef.current;
            touchStartRef.current = null;
            if (!start) return;
            const touch = event.changedTouches[0];
            const dx = touch.clientX - start.x;
            const dy = touch.clientY - start.y;
            if (Math.abs(dx) < SWIPE_MIN_DISTANCE_PX || Math.abs(dx) < Math.abs(dy)) return;
            // Swipe left (finger moves left) shows the next photo.
            navigate(dx < 0 ? 1 : -1);
          }}
        >
          <AnimatePresence initial={false} custom={direction}>
            {/* Absolutely filling the stage gives the image a definite box to
                fit into, and lets the outgoing and incoming photos overlap
                while they slide. */}
            <motion.div
              key={photo.id}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.25, ease: "easeInOut" }}
              className="absolute inset-0 flex items-center justify-center px-2 pb-2 will-change-transform sm:pb-4"
            >
              <div className="flex h-full w-full items-center justify-center [container-type:size]">
                <ViewerImage photo={photo} />
              </div>
            </motion.div>
          </AnimatePresence>

          {index > 0 && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute inset-y-0 left-2 z-10 my-auto rounded-full bg-black/30 text-white hover:bg-black/50 sm:left-4"
              onClick={() => navigate(-1)}
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
              onClick={() => navigate(1)}
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
