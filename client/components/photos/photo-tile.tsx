"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { RiCheckLine, RiPlayCircleFill } from "@remixicon/react";
import { Camera, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToggleStar } from "@/hooks/use-photos";
import { getPlaceholderSrc, getTileImageSources } from "@/lib/imagekit";
import { AnimatedStar } from "@/components/photos/animated-star";
import type { Photo } from "@/lib/api";

// A 9:16 portrait in a 150px mobile row is only ~49px wide - at that size the
// 24px select circle, star and EXIF badges cover most of the photo.
const COMPACT_TILE_WIDTH = 60;

type PhotoTileProps = {
  photo: Photo;
  /** Rendered size in CSS pixels - the parent grid cell sets the actual box. */
  width: number;
  height: number;
  selected: boolean;
  selectionActive: boolean;
  onToggleSelect: (id: string) => void;
  onOpen: (photo: Photo) => void;
  menu?: React.ReactNode;
};

export function PhotoTile({
  photo,
  width,
  height,
  selected,
  selectionActive,
  onToggleSelect,
  onOpen,
  menu,
}: PhotoTileProps) {
  const isVideo = photo.mimeType?.startsWith("video/");
  const toggleStar = useToggleStar();
  const [loaded, setLoaded] = useState(false);
  // Dropped once the real image has fully faded in over it.
  const [placeholderDone, setPlaceholderDone] = useState(false);
  // If the sized rendition ever fails, fall back to the stored thumbnail
  // rather than leaving an empty tile.
  const [sizedFailed, setSizedFailed] = useState(false);
  const { src, srcSet } = sizedFailed
    ? { src: photo.thumbnailUrl || photo.url, srcSet: undefined }
    : getTileImageSources(photo, height);
  const placeholderSrc = getPlaceholderSrc(photo);

  // Compact tiles drop the overlays unless they carry state: the checkbox
  // returns once selection mode is on (so the tile can still be picked), and a
  // starred photo keeps its star. Opening the photo still offers every action.
  const compact = width < COMPACT_TILE_WIDTH;
  const showSelect = !compact || selectionActive || selected;
  const showStar = !compact || photo.starred;
  const showMetaBadges = !compact && (photo.hasCameraData || photo.hasGpsData);
  const showMenu = Boolean(menu) && !(compact && selectionActive);
  const label = photo.fileName || "Photo";

  return (
    <div
      className={cn(
        // Hover lift: transform (scale) + a touch of brightness, never a size
        // change, so the justified rows don't reflow; the shadow is a separate
        // layer in JustifiedGrid's cell (this element clips its content).
        // Tailwind's hover variant only applies on devices that can hover -
        // taps on touch screens don't trigger a stuck "lifted" state.
        "group/tile relative h-full w-full overflow-hidden rounded-lg bg-muted select-none transition-[scale] duration-150 ease-out hover:scale-[1.02]",
        // Dark mode gets a faint hairline so dark photos keep their edges
        // against the black page; the selection ring replaces it.
        selected ? "ring-2 ring-primary ring-offset-2 ring-offset-background" : "dark:ring-1 dark:ring-foreground/10",
      )}
    >
      {placeholderSrc && !placeholderDone && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={placeholderSrc}
          alt=""
          aria-hidden
          loading="lazy"
          decoding="async"
          draggable={false}
          // Scaled up so the blur's soft edges fall outside the rounded tile.
          className="absolute inset-0 h-full w-full scale-110 object-cover blur-lg"
        />
      )}

      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        srcSet={srcSet}
        alt={label}
        loading="lazy"
        decoding="async"
        draggable={false}
        onLoad={() => setLoaded(true)}
        onError={() => {
          if (srcSet) setSizedFailed(true);
        }}
        onTransitionEnd={(event) => {
          if (event.propertyName === "opacity" && loaded) setPlaceholderDone(true);
        }}
        className={cn(
          "relative h-full w-full object-cover [transition:opacity_300ms_ease-out,scale_300ms_ease-out,filter_150ms_ease-out]",
          loaded ? "opacity-100" : "opacity-0",
          selected ? "scale-95" : "group-hover/tile:brightness-105",
        )}
      />

      {/* Short scrims behind the white overlay controls so they stay legible
          on light photos - top for the checkbox, bottom for the star. Same in
          both themes: they darken the photo, not the page. Shown on hover;
          selection mode keeps the top one for its always-visible checkboxes. */}
      <div
        aria-hidden
        className={cn(
          "pointer-events-none absolute inset-x-0 top-0 h-12 bg-linear-to-b from-black/40 to-transparent opacity-0 transition-opacity duration-150 sm:group-hover/tile:opacity-100",
          selectionActive && "opacity-100",
        )}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-linear-to-t from-black/40 to-transparent opacity-0 transition-opacity duration-150 sm:group-hover/tile:opacity-100"
      />

      {isVideo && (
        <RiPlayCircleFill className="absolute bottom-1.5 right-1.5 size-5 text-white drop-shadow" />
      )}

      {showMetaBadges && (
        // Spec calls for top-left, but that's already the selection checkbox's
        // spot - bottom-left is the one corner nothing else occupies.
        <div
          className={cn(
            "absolute bottom-1.5 left-1.5 flex items-center gap-1 opacity-100 transition-opacity sm:opacity-0 sm:group-hover/tile:opacity-100",
          )}
        >
          {photo.hasCameraData && (
            <span className="flex size-5 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm">
              <Camera className="size-3" />
            </span>
          )}
          {photo.hasGpsData && (
            <span className="flex size-5 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm">
              <MapPin className="size-3" />
            </span>
          )}
        </div>
      )}

      {/* The tile's primary action is a real button covering the photo, so
          photos can be opened - or picked in selection mode - from the
          keyboard. It sits before the select and star buttons, which stay on
          top of it, so tab order is open, select, star. It deliberately has no
          press-scale: pressing the photo itself opens it, not "clicks" it. */}
      <button
        type="button"
        aria-label={selectionActive ? `${selected ? "Deselect" : "Select"} ${label}` : `Open ${label}`}
        onClick={() => (selectionActive ? onToggleSelect(photo.id) : onOpen(photo))}
        className="absolute inset-0 cursor-pointer rounded-lg outline-none focus-visible:ring-3 focus-visible:ring-primary focus-visible:ring-inset"
      />

      {showSelect && (
        <button
          type="button"
          aria-label={selected ? "Deselect photo" : "Select photo"}
          onClick={(event) => {
            event.stopPropagation();
            onToggleSelect(photo.id);
          }}
          className={cn(
            // Hover-revealed on pointer devices, but always visible below `sm` since
            // touch screens have no hover state to reveal it with otherwise.
            "absolute left-1.5 top-1.5 flex size-6 items-center justify-center rounded-full border-2 border-white/80 bg-black/10 text-white opacity-100 shadow-sm backdrop-blur-sm transition-[opacity,scale,border-color] duration-150 active:scale-90 sm:opacity-0 sm:group-hover/tile:opacity-100 focus-visible:opacity-100",
            // Must be `sm:` too - a plain opacity-100 loses to the `sm:opacity-0`
            // hover gate above, which hid the checkmark on desktop until hover.
            selected && "border-primary sm:opacity-100",
          )}
        >
          <AnimatePresence initial={false}>
            {selected && (
              // The filled dot pops in with a spring and shrinks away on deselect.
              <motion.span
                key="selected"
                className="absolute -inset-0.5 flex items-center justify-center rounded-full bg-primary text-primary-foreground"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0, opacity: 0, transition: { duration: 0.15, ease: "easeIn" } }}
                transition={{ type: "spring", stiffness: 500, damping: 22 }}
              >
                <RiCheckLine className="size-3.5" />
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      )}

      {showStar && (
        <button
          type="button"
          aria-label={photo.starred ? "Unstar photo" : "Star photo"}
          onClick={(event) => {
            event.stopPropagation();
            toggleStar.mutate(photo);
          }}
          className={cn(
            "absolute bottom-1.5 right-1.5 flex size-6 items-center justify-center rounded-full bg-black/10 opacity-100 shadow-sm backdrop-blur-sm transition-[opacity,scale] duration-150 active:scale-90 sm:opacity-0 sm:group-hover/tile:opacity-100 focus-visible:opacity-100",
            photo.starred && "sm:opacity-100",
          )}
        >
          <AnimatedStar starred={photo.starred} className="size-3.5" outlineClassName="text-white" />
        </button>
      )}

      {showMenu && (
        <div
          className="absolute right-1.5 top-1.5 opacity-100 transition-opacity sm:opacity-0 sm:group-hover/tile:opacity-100 focus-within:opacity-100"
          onClick={(event) => event.stopPropagation()}
        >
          {menu}
        </div>
      )}
    </div>
  );
}
