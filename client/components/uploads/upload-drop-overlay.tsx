"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Upload } from "lucide-react";
import { cn } from "@/lib/utils";

// How long the overlay stays up after a drop, pulsing to confirm it landed.
const DROP_FLASH_MS = 150;

type UploadDropOverlayProps = {
  enabled: boolean;
  onFiles: (files: File[]) => void;
  children: React.ReactNode;
};

function isFileDrag(event: DragEvent) {
  return event.dataTransfer?.types.includes("Files") ?? false;
}

export function UploadDropOverlay({ enabled, onFiles, children }: UploadDropOverlayProps) {
  // A counter rather than a boolean: dragging over a child element fires
  // dragLeave on the parent before dragEnter on the child, so a boolean would
  // flicker the overlay off and back on for every child boundary crossed.
  const [dragCounter, setDragCounter] = useState(0);
  const [flashing, setFlashing] = useState(false);
  const onFilesRef = useRef(onFiles);

  useEffect(() => {
    onFilesRef.current = onFiles;
  }, [onFiles]);

  // Listens on window rather than on the content wrapper: the overlay covers
  // the whole viewport (so its card is centered on screen no matter how far
  // the grid is scrolled), and a drop that lands on the header or sidebar
  // must upload too instead of the browser navigating away to the file.
  useEffect(() => {
    if (!enabled) return;

    let flashTimer: ReturnType<typeof setTimeout> | null = null;

    function handleDragEnter(event: DragEvent) {
      if (!isFileDrag(event)) return;
      event.preventDefault();
      setDragCounter((count) => count + 1);
    }

    function handleDragOver(event: DragEvent) {
      if (!isFileDrag(event)) return;
      event.preventDefault();
    }

    function handleDragLeave(event: DragEvent) {
      if (!isFileDrag(event)) return;
      setDragCounter((count) => Math.max(0, count - 1));
    }

    function handleDrop(event: DragEvent) {
      if (!isFileDrag(event)) return;
      event.preventDefault();
      setDragCounter(0);
      // No type filter here - HEIC and drag-and-drop files often arrive with an
      // empty or generic File.type, and useUploadQueue's validateFile already
      // does the real accept/reject decision (MIME type, then extension
      // fallback) and surfaces rejects as visible error rows instead of the
      // silent drop this pre-filter used to cause.
      const files = Array.from(event.dataTransfer?.files ?? []);
      if (files.length > 0) {
        onFilesRef.current(files);
        // A brief pulse before the overlay leaves confirms the drop landed.
        if (flashTimer) clearTimeout(flashTimer);
        setFlashing(true);
        flashTimer = setTimeout(() => setFlashing(false), DROP_FLASH_MS);
      }
    }

    window.addEventListener("dragenter", handleDragEnter);
    window.addEventListener("dragover", handleDragOver);
    window.addEventListener("dragleave", handleDragLeave);
    window.addEventListener("drop", handleDrop);

    return () => {
      window.removeEventListener("dragenter", handleDragEnter);
      window.removeEventListener("dragover", handleDragOver);
      window.removeEventListener("dragleave", handleDragLeave);
      window.removeEventListener("drop", handleDrop);
      if (flashTimer) clearTimeout(flashTimer);
      setDragCounter(0);
      setFlashing(false);
    };
  }, [enabled]);

  const visible = enabled && (dragCounter > 0 || flashing);

  // Always renders the same wrapper so `<main>` keeps the same flex-1 layout
  // context on every route - only the listeners/overlay depend on `enabled`.
  return (
    <div className="relative flex-1">
      {children}

      <AnimatePresence>
        {visible && (
          <motion.div
            key="drop-overlay"
            role="status"
            aria-live="polite"
            className={cn(
              "pointer-events-none fixed inset-0 z-50 flex items-center justify-center p-6 backdrop-blur-[2px] transition-colors duration-100",
              flashing ? "bg-primary/25" : "bg-primary/10",
            )}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
          >
            <motion.div
              className="relative flex flex-col items-center gap-3 rounded-3xl bg-background/95 px-12 py-10 text-center shadow-lg"
              initial={{ scale: 0.96 }}
              animate={{ scale: flashing ? 1.04 : 1 }}
              exit={{ scale: 0.96 }}
              transition={{ duration: flashing ? 0.1 : 0.15, ease: "easeOut" }}
            >
              {/* A CSS dashed border can't animate, so the dashes are an SVG
                  outline whose dash offset marches around the card. */}
              <svg aria-hidden className="pointer-events-none absolute inset-0 h-full w-full overflow-visible">
                <rect
                  x="1"
                  y="1"
                  rx="30"
                  ry="30"
                  fill="none"
                  strokeWidth="2"
                  strokeDasharray="10 10"
                  className="animate-march stroke-primary"
                  style={{ width: "calc(100% - 2px)", height: "calc(100% - 2px)" }}
                />
              </svg>
              <Upload className="size-10 animate-float text-primary" />
              <p className="text-lg font-medium text-foreground">
                {flashing ? "Uploading…" : "Drop photos here to upload"}
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
