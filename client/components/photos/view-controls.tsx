"use client";

import { useId } from "react";
import { LayoutGroup, motion } from "framer-motion";
import { ArrowUpDown, Grid2x2, Grid3x3, SlidersHorizontal, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DENSITY_OPTIONS, SORT_OPTIONS, type GridDensity } from "@/hooks/use-grid-preferences";
import type { PhotoSort } from "@/lib/api";
import { cn } from "@/lib/utils";

const DENSITY_ICONS: Record<GridDensity, React.ComponentType<{ className?: string }>> = {
  compact: Grid3x3,
  comfortable: Grid2x2,
  spacious: Square,
};

const SHORT_SORT_LABELS: Record<PhotoSort, string> = {
  taken_desc: "Newest",
  taken_asc: "Oldest",
  added_desc: "Recently added",
  added_asc: "First added",
};

type ViewControlsProps = {
  density: GridDensity;
  onDensityChange: (density: GridDensity) => void;
  /** Omitted where the order is fixed (search relevance, album order). */
  sort?: PhotoSort;
  onSortChange?: (sort: PhotoSort) => void;
  /** Sorting is locked by the current filter (e.g. "Recent" is always newest upload first). */
  sortDisabled?: boolean;
};

function DensityToggle({ density, onDensityChange }: Pick<ViewControlsProps, "density" | "onDensityChange">) {
  const layoutGroupId = useId();
  return (
    <LayoutGroup id={layoutGroupId}>
      <div role="radiogroup" aria-label="Grid density" className="flex items-center rounded-full border border-border p-0.5">
        {DENSITY_OPTIONS.map((option) => {
          const Icon = DENSITY_ICONS[option.value];
          const active = option.value === density;
          return (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={active}
              aria-label={option.label}
              title={option.label}
              onClick={() => onDensityChange(option.value)}
              className={cn(
                "relative flex size-7 items-center justify-center rounded-full outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring",
                active ? "text-primary" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {active && (
                <motion.span
                  layoutId="density-indicator"
                  aria-hidden
                  className="absolute inset-0 rounded-full bg-primary/10"
                  transition={{ type: "spring", stiffness: 500, damping: 30, mass: 0.5 }}
                />
              )}
              <Icon className="relative size-3.5" />
            </button>
          );
        })}
      </div>
    </LayoutGroup>
  );
}

function SortItems({ sort, onSortChange }: { sort: PhotoSort; onSortChange: (sort: PhotoSort) => void }) {
  return (
    <DropdownMenuGroup>
      <DropdownMenuLabel>Sort by</DropdownMenuLabel>
      <DropdownMenuRadioGroup value={sort} onValueChange={(value) => onSortChange(value as PhotoSort)}>
        {SORT_OPTIONS.map((option) => (
          <DropdownMenuRadioItem key={option.value} value={option.value} closeOnClick>
            {option.label}
          </DropdownMenuRadioItem>
        ))}
      </DropdownMenuRadioGroup>
    </DropdownMenuGroup>
  );
}

/**
 * Grid density and sort for the contextual toolbar. Roomy screens get a
 * segmented density toggle and a sort menu; phones get both in one menu.
 */
export function ViewControls({ density, onDensityChange, sort, onSortChange, sortDisabled }: ViewControlsProps) {
  const canSort = sort !== undefined && onSortChange !== undefined && !sortDisabled;

  return (
    <div className="flex shrink-0 items-center gap-2">
      <div className="hidden items-center gap-2 sm:flex">
        <DensityToggle density={density} onDensityChange={onDensityChange} />
        {canSort && (
          <DropdownMenu>
            <DropdownMenuTrigger render={<Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground" />}>
              <ArrowUpDown className="size-3.5" />
              {SHORT_SORT_LABELS[sort]}
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <SortItems sort={sort} onSortChange={onSortChange} />
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      <div className="sm:hidden">
        <DropdownMenu>
          <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" aria-label="View options" />}>
            <SlidersHorizontal className="size-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuGroup>
              <DropdownMenuLabel>Density</DropdownMenuLabel>
              <DropdownMenuRadioGroup value={density} onValueChange={(value) => onDensityChange(value as GridDensity)}>
                {DENSITY_OPTIONS.map((option) => (
                  <DropdownMenuRadioItem key={option.value} value={option.value} closeOnClick>
                    {option.label}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuGroup>
            {canSort && (
              <>
                <DropdownMenuSeparator />
                <SortItems sort={sort} onSortChange={onSortChange} />
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
