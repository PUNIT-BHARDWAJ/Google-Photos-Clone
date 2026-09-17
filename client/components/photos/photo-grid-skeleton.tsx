"use client";

import { useTargetRowHeight } from "@/hooks/use-target-row-height";

// Varied ratios so the skeleton reads as a justified grid (mixed tile
// widths), not a uniform grid - doesn't need to know real container width,
// flex-wrap lets it approximate the eventual layout well enough for a
// loading placeholder.
const SKELETON_ASPECT_RATIOS = [1.5, 1, 0.75, 1.78, 1.33, 1, 0.67, 1.5, 1.2, 0.8, 1.6, 1];

export function PhotoGridSkeleton() {
  const targetRowHeight = useTargetRowHeight();

  return (
    <div className="space-y-8">
      {[0, 1].map((sectionIndex) => (
        <div key={sectionIndex} className="space-y-3">
          <div className="h-4 w-32 animate-pulse rounded bg-muted" />
          <div className="flex flex-wrap gap-1">
            {SKELETON_ASPECT_RATIOS.map((ratio, itemIndex) => (
              <div
                key={itemIndex}
                className="shrink-0 animate-pulse rounded-lg bg-muted"
                style={{ width: Math.round(ratio * targetRowHeight), height: targetRowHeight }}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
