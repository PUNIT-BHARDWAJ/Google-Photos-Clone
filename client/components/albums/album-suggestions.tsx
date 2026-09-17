"use client";

import { useMemo, useSyncExternalStore } from "react";
import { RiSparkling2Line } from "@remixicon/react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useAlbumSuggestions, useCreateSuggestedAlbum } from "@/hooks/use-ai";
import type { AlbumSuggestion } from "@/lib/api";
import { getSquareThumbnailSrc } from "@/lib/imagekit";

const DISMISSED_KEY = "gp-dismissed-album-suggestions";
const DISMISSED_EVENT = "gp-dismissed-album-suggestions-change";

// Dismissals live in localStorage (per browser, as a convenience). Read through
// useSyncExternalStore so the server render and first client render agree.
function subscribe(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener(DISMISSED_EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(DISMISSED_EVENT, onChange);
  };
}

function readDismissed() {
  try {
    return window.localStorage.getItem(DISMISSED_KEY) ?? "[]";
  } catch {
    return "[]";
  }
}

function dismiss(id: string) {
  try {
    const current: unknown = JSON.parse(readDismissed());
    const ids = Array.isArray(current) ? current.filter((value) => typeof value === "string") : [];
    if (!ids.includes(id)) ids.push(id);
    window.localStorage.setItem(DISMISSED_KEY, JSON.stringify(ids));
  } catch {
    // Storage unavailable (private mode) - nothing to persist to.
  }
  window.dispatchEvent(new Event(DISMISSED_EVENT));
}

function useDismissedIds() {
  const raw = useSyncExternalStore(subscribe, readDismissed, () => "[]");
  return useMemo(() => {
    try {
      const parsed: unknown = JSON.parse(raw);
      return new Set(Array.isArray(parsed) ? parsed.filter((value) => typeof value === "string") : []);
    } catch {
      return new Set<string>();
    }
  }, [raw]);
}

export function AlbumSuggestions() {
  const { data: suggestions } = useAlbumSuggestions();
  const dismissed = useDismissedIds();
  const create = useCreateSuggestedAlbum();

  const visible = suggestions?.filter((suggestion) => !dismissed.has(suggestion.id)) ?? [];
  if (visible.length === 0) return null;

  return (
    <section aria-labelledby="album-suggestions-heading" className="mb-8">
      <div className="mb-3">
        <h2 id="album-suggestions-heading" className="flex items-center gap-2 text-base font-medium text-foreground">
          <RiSparkling2Line className="size-4 text-primary" />
          Suggested albums
        </h2>
        <p className="text-sm text-muted-foreground">Groups of photos that might make a good album</p>
      </div>
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {visible.map((suggestion) => (
          <SuggestionCard
            key={suggestion.id}
            suggestion={suggestion}
            creating={create.isPending && create.variables?.id === suggestion.id}
            disabled={create.isPending}
            onCreate={() => create.mutate(suggestion)}
            onDismiss={() => dismiss(suggestion.id)}
          />
        ))}
      </ul>
    </section>
  );
}

type SuggestionCardProps = {
  suggestion: AlbumSuggestion;
  creating: boolean;
  disabled: boolean;
  onCreate: () => void;
  onDismiss: () => void;
};

function SuggestionCard({ suggestion, creating, disabled, onCreate, onDismiss }: SuggestionCardProps) {
  const previews = suggestion.previewThumbnailUrls.slice(0, 4);

  return (
    <li className="flex gap-3 rounded-2xl border border-border bg-card p-3 text-card-foreground">
      <div className="grid size-24 shrink-0 grid-cols-2 grid-rows-2 gap-0.5 overflow-hidden rounded-xl bg-muted">
        {previews.map((src, index) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={`${src}-${index}`}
            src={getSquareThumbnailSrc(src, 120)}
            alt=""
            loading="lazy"
            className={previews.length === 1 ? "col-span-2 row-span-2 h-full w-full object-cover" : "h-full w-full object-cover"}
          />
        ))}
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <p className="truncate text-sm font-medium text-foreground" title={suggestion.suggestedName}>
          {suggestion.suggestedName}
        </p>
        <p className="line-clamp-2 text-xs text-muted-foreground">{suggestion.reason}</p>
        <div className="mt-auto flex flex-wrap gap-1.5 pt-2">
          <Button size="sm" onClick={onCreate} disabled={disabled}>
            {creating && <Spinner data-icon="inline-start" />}
            Create album
          </Button>
          <Button size="sm" variant="ghost" onClick={onDismiss} disabled={creating}>
            Dismiss
          </Button>
        </div>
      </div>
    </li>
  );
}
