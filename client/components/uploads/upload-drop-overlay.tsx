"use client";

import { useEffect, useRef, useState } from "react";
import { Upload } from "lucide-react";

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
      setDragCounter(0);
    };
  }, [enabled]);

  // Always renders the same wrapper so `<main>` keeps the same flex-1 layout
  // context on every route - only the listeners/overlay depend on `enabled`.
  return (
    <div className="relative flex-1">
      {children}

      {enabled && dragCounter > 0 && (
        <div
          role="status"
          aria-live="polite"
          className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center bg-primary/10 p-6 backdrop-blur-[2px]"
        >
          <div className="flex flex-col items-center gap-3 rounded-3xl border-2 border-dashed border-primary bg-background/95 px-12 py-10 text-center shadow-lg animate-in fade-in zoom-in-95 duration-150">
            <Upload className="size-10 text-primary" />
            <p className="text-lg font-medium text-foreground">Drop photos here to upload</p>
          </div>
        </div>
      )}
    </div>
  );
}
