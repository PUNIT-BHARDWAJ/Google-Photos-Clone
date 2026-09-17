"use client";

import Link from "next/link";
import { RiRefreshLine, RiSparkling2Line } from "@remixicon/react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useAiStatus, useAnalyzePhoto, usePendingAnalysis } from "@/hooks/use-ai";
import { colorNameToCss, formatSceneType } from "@/lib/ai";
import type { Photo } from "@/lib/api";
import { SceneIcon } from "@/components/photos/scene-icon";

type AiAnalysisSectionProps = {
  photo: Photo;
  open: boolean;
  onSearchTag: (tag: string) => void;
};

export function AiAnalysisSection({ photo, open, onSearchTag }: AiAnalysisSectionProps) {
  const { data: status, isLoading: statusLoading } = useAiStatus();
  const analyze = useAnalyzePhoto();
  const configured = status?.configured ?? false;
  usePendingAnalysis(photo, open && configured);

  const heading = (
    <h3 className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
      <RiSparkling2Line className="size-3.5" />
      AI analysis
    </h3>
  );

  if (statusLoading) {
    return (
      <div className="space-y-2">
        {heading}
        <Spinner className="size-4 text-muted-foreground" />
      </div>
    );
  }

  // Analysis done before the key was removed is still worth showing.
  if (!configured && !photo.aiProcessedAt) {
    return (
      <div className="space-y-2">
        {heading}
        <p className="text-sm text-muted-foreground">AI features not configured</p>
        <Link href="/settings#ai-features" className="inline-block text-sm text-primary hover:underline">
          How to set up AI
        </Link>
      </div>
    );
  }

  const analyzing = analyze.isPending || photo.aiPending;

  if (analyzing) {
    return (
      <div className="space-y-2">
        {heading}
        <p className="flex items-center gap-2 text-sm text-muted-foreground" role="status">
          <Spinner className="size-4" />
          Analyzing photo…
        </p>
      </div>
    );
  }

  if (!photo.aiProcessedAt) {
    return (
      <div className="space-y-2">
        {heading}
        {photo.aiError ? (
          <p className="text-sm text-destructive">{photo.aiError}</p>
        ) : (
          <p className="text-sm text-muted-foreground">Not yet analyzed</p>
        )}
        <Button size="sm" variant="outline" onClick={() => analyze.mutate(photo.id)}>
          {photo.aiError ? <RiRefreshLine data-icon="inline-start" /> : <RiSparkling2Line data-icon="inline-start" />}
          {photo.aiError ? "Retry" : "Analyze"}
        </Button>
      </div>
    );
  }

  const colors = photo.aiDominantColors
    .map((name) => ({ name, css: colorNameToCss(name) }))
    .filter((color): color is { name: string; css: string } => color.css !== null);

  return (
    <div className="space-y-3">
      {heading}

      {photo.aiCaption && <p className="text-sm leading-relaxed text-foreground">{photo.aiCaption}</p>}

      {photo.aiTags.length > 0 && (
        <div className="flex flex-wrap gap-1.5" aria-label="AI tags">
          {photo.aiTags.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => onSearchTag(tag)}
              title={`Search for "${tag}"`}
              className="rounded-full bg-secondary px-2.5 py-0.5 text-xs text-secondary-foreground transition-colors hover:bg-primary/10 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {tag}
            </button>
          ))}
        </div>
      )}

      <div className="space-y-2">
        {photo.aiSceneType && (
          <div className="flex items-center justify-between gap-3 text-sm">
            <span className="text-muted-foreground">Scene</span>
            <span className="inline-flex items-center gap-1.5 text-foreground">
              <SceneIcon scene={photo.aiSceneType} className="size-4 text-muted-foreground" />
              {formatSceneType(photo.aiSceneType)}
            </span>
          </div>
        )}
        {colors.length > 0 && (
          <div className="flex items-center justify-between gap-3 text-sm">
            <span className="text-muted-foreground">Colors</span>
            <span className="flex items-center gap-1.5">
              {colors.map((color) => (
                <span
                  key={color.name}
                  title={color.name}
                  aria-label={color.name}
                  role="img"
                  className="size-4 rounded-full ring-1 ring-foreground/15"
                  style={{ backgroundColor: color.css }}
                />
              ))}
            </span>
          </div>
        )}
      </div>

      {configured && (
        <Button
          size="sm"
          variant="ghost"
          className="-ml-2 text-muted-foreground"
          onClick={() => analyze.mutate(photo.id)}
        >
          <RiRefreshLine data-icon="inline-start" />
          Analyze again
        </Button>
      )}
    </div>
  );
}
