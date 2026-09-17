"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const ACCEPTED_UPLOAD_TYPES =
  "image/jpeg,image/png,image/gif,image/webp,image/heic,image/heif,image/bmp,image/tiff,image/svg+xml";

const CHECK_FLASH_MS = 1000;
// Ring geometry: a 68px box around the 56px button.
const RING_SIZE = 68;
const RING_RADIUS = 32;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

type UploadFabProps = {
  onFiles: (files: File[]) => void;
  /** Overall progress (0-100) while uploads are running, null when idle. */
  progress: number | null;
  /** Whether any upload in the batch that just finished succeeded. */
  completed: boolean;
  /** Pulse gently to invite the first upload. */
  pulse: boolean;
  /**
   * The phone bottom bar slid away. The FAB sits just above that bar and
   * follows it down a beat later (a cascading spring), then back up.
   */
  navHidden?: boolean;
};

export function UploadFab({ onFiles, progress, completed, pulse, navHidden = false }: UploadFabProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const active = progress !== null;

  // When a batch finishes, the "+" briefly becomes a check. The switch into
  // that state is derived during render; the effect only schedules the revert.
  const [wasActive, setWasActive] = useState(active);
  const [checkCount, setCheckCount] = useState(0);
  const [showCheck, setShowCheck] = useState(false);
  if (active !== wasActive) {
    setWasActive(active);
    if (!active && completed) {
      setShowCheck(true);
      setCheckCount((count) => count + 1);
    }
  }

  useEffect(() => {
    if (checkCount === 0) return;
    const timer = setTimeout(() => setShowCheck(false), CHECK_FLASH_MS);
    return () => clearTimeout(timer);
  }, [checkCount]);

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_UPLOAD_TYPES}
        multiple
        className="hidden"
        onChange={(event) => {
          const files = Array.from(event.target.files ?? []);
          if (files.length) onFiles(files);
          event.target.value = "";
        }}
      />
      <motion.div
        className="group/fab fixed right-6 bottom-6 z-30 size-14 max-md:right-4 max-md:bottom-[calc(80px+env(safe-area-inset-bottom))]"
        initial={false}
        animate={{ y: navHidden ? 72 : 0 }}
        transition={{ type: "spring", stiffness: 400, damping: 35, delay: 0.03 }}
      >
        {pulse && !active && (
          // Transform + opacity ring, once every 5s - only while the library
          // is empty, to nudge the first upload.
          <span aria-hidden className="pointer-events-none absolute inset-0 animate-fab-pulse rounded-full bg-primary" />
        )}

        <AnimatePresence>
          {active && (
            <motion.svg
              key="progress-ring"
              role="progressbar"
              aria-label="Upload progress"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={progress}
              width={RING_SIZE}
              height={RING_SIZE}
              viewBox={`0 0 ${RING_SIZE} ${RING_SIZE}`}
              className="pointer-events-none absolute -top-1.5 -left-1.5 -rotate-90"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.1 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
            >
              <circle
                cx={RING_SIZE / 2}
                cy={RING_SIZE / 2}
                r={RING_RADIUS}
                fill="none"
                strokeWidth={3}
                className="stroke-primary/20"
              />
              <circle
                cx={RING_SIZE / 2}
                cy={RING_SIZE / 2}
                r={RING_RADIUS}
                fill="none"
                strokeWidth={3}
                strokeLinecap="round"
                strokeDasharray={RING_CIRCUMFERENCE}
                strokeDashoffset={RING_CIRCUMFERENCE * (1 - progress / 100)}
                className="stroke-primary transition-[stroke-dashoffset] duration-200 ease-out"
              />
            </motion.svg>
          )}
        </AnimatePresence>

        {/* Deeper hover shadow as its own layer, faded in with opacity rather
            than transitioning box-shadow (a repaint every frame). */}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-full opacity-0 shadow-xl transition-[opacity,scale] duration-150 group-hover/fab:scale-105 group-hover/fab:opacity-100"
        />

        <Button
          type="button"
          aria-label="Upload photos"
          onClick={() => inputRef.current?.click()}
          className={cn(
            "relative size-14 rounded-full shadow-lg transition-[scale,background-color] hover:scale-105",
            showCheck && "bg-green-600 hover:bg-green-600/90",
          )}
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.span
              key={showCheck ? "check" : "plus"}
              className="inline-flex"
              initial={{ scale: 0.5, opacity: 0, rotate: showCheck ? -45 : 45 }}
              animate={{ scale: 1, opacity: 1, rotate: 0 }}
              exit={{ scale: 0.5, opacity: 0 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
            >
              {showCheck ? <Check className="size-6" /> : <Plus className="size-6" />}
            </motion.span>
          </AnimatePresence>
        </Button>
      </motion.div>
    </>
  );
}
