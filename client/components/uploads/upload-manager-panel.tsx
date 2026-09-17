"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown, Loader2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { UploadItem } from "@/hooks/use-upload-queue";

type UploadManagerPanelProps = {
  items: UploadItem[];
  onRetry: (id: string) => void;
  onDismiss: (id: string) => void;
};

function UploadRow({ item, onRetry, onDismiss }: { item: UploadItem; onRetry: () => void; onDismiss: () => void }) {
  return (
    <div className="flex items-center gap-2.5 rounded-xl px-2 py-1.5">
      <div className="size-9 shrink-0 overflow-hidden rounded-lg bg-muted">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={item.previewUrl} alt="" className="h-full w-full object-cover" />
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-medium text-foreground">{item.file.name}</p>
        {item.status === "error" ? (
          <p className="truncate text-xs text-destructive">{item.error}</p>
        ) : (
          <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all duration-200"
              style={{ width: `${item.status === "done" ? 100 : item.progress}%` }}
            />
          </div>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-1.5">
        {(item.status === "uploading" || item.status === "pending") && (
          <Loader2 className="size-4 animate-spin text-muted-foreground" />
        )}
        {item.status === "done" && <Check className="size-4 text-green-600" />}
        {item.status === "error" && (
          <button
            type="button"
            onClick={onRetry}
            className="text-xs font-medium text-primary hover:underline"
          >
            Retry
          </button>
        )}
        {(item.status === "done" || item.status === "error") && (
          <button
            type="button"
            onClick={onDismiss}
            aria-label="Dismiss"
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="size-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}

// Read by the root layout's Toaster offset so toasts stack above this panel
// rather than on top of it.
const TOAST_OFFSET_VAR = "--upload-panel-offset";
const TOAST_GAP_PX = 12;

export function UploadManagerPanel({ items, onRetry, onDismiss }: UploadManagerPanelProps) {
  const [collapsed, setCollapsed] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const visible = items.length > 0;

  // Publishes the panel's live height (it grows per row and shrinks when
  // collapsed) as a CSS variable. Only the DOM is written here, no React state.
  useEffect(() => {
    const root = document.documentElement;
    const node = panelRef.current;
    if (!visible || !node) {
      root.style.removeProperty(TOAST_OFFSET_VAR);
      return;
    }

    const publish = () => root.style.setProperty(TOAST_OFFSET_VAR, `${node.offsetHeight + TOAST_GAP_PX}px`);
    const observer = new ResizeObserver(publish);
    observer.observe(node);
    publish();

    return () => {
      observer.disconnect();
      root.style.removeProperty(TOAST_OFFSET_VAR);
    };
  }, [visible]);

  if (!visible) return null;

  const activeCount = items.filter((item) => item.status === "pending" || item.status === "uploading").length;
  const errorCount = items.filter((item) => item.status === "error").length;

  const headerText =
    activeCount > 0
      ? `Uploading ${items.length} photo${items.length === 1 ? "" : "s"}`
      : errorCount > 0
        ? `Upload complete (${errorCount} failed)`
        : "Upload complete";

  return (
    <div
      ref={panelRef}
      role="status"
      aria-live="polite"
      className="fixed bottom-24 right-6 z-30 w-80 max-w-[calc(100vw-3rem)] max-md:right-4 max-md:bottom-[calc(148px+env(safe-area-inset-bottom))] max-md:max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border border-border bg-card shadow-xl dark:shadow-none"
    >
      <button
        type="button"
        onClick={() => setCollapsed((prev) => !prev)}
        aria-expanded={!collapsed}
        className="flex w-full items-center justify-between gap-2 px-4 py-3 text-sm font-medium text-foreground"
      >
        <span>{headerText}</span>
        <ChevronDown className={cn("size-4 text-muted-foreground transition-transform", collapsed && "rotate-180")} />
      </button>

      {!collapsed && (
        <div className="max-h-72 space-y-0.5 overflow-y-auto border-t border-border px-2 py-2">
          {items.map((item) => (
            <UploadRow
              key={item.id}
              item={item}
              onRetry={() => onRetry(item.id)}
              onDismiss={() => onDismiss(item.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
