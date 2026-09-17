"use client";

import { RiCloseLine } from "@remixicon/react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type SelectionToolbarProps = {
  count: number;
  onClear: () => void;
  actions: React.ReactNode;
};

export function SelectionToolbar({ count, onClear, actions }: SelectionToolbarProps) {
  if (count === 0) return null;

  return (
    // top-[60px] matches the app shell's 60.8px sticky header (see PhotoGrid's
    // day headings) - top-16 left a strip where photos showed through.
    <div className="sticky top-[60px] z-20 -mx-4 mb-6 flex items-center justify-between gap-3 border-b border-border/60 bg-background/95 px-4 py-3 backdrop-blur-sm sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
      <div className="flex shrink-0 items-center gap-2">
        <Button variant="ghost" size="icon-sm" onClick={onClear} aria-label="Clear selection">
          <RiCloseLine className="size-4" />
        </Button>
        <span className="text-sm font-medium text-foreground">{count} selected</span>
      </div>
      {/* Actions go icon-only below `sm` (see SelectionAction), which fits every
          page's action set beside the count. overflow-x-auto stays only as a
          safety net for a longer set, with its scrollbar hidden. */}
      <div className="flex min-w-0 items-center gap-1.5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {actions}
      </div>
    </div>
  );
}

type SelectionActionProps = Omit<React.ComponentProps<typeof Button>, "children" | "size"> & {
  icon: React.ReactNode;
  label: string;
};

/**
 * A selection toolbar button: icon + label from `sm` up, icon-only on phones -
 * where four labelled buttons need ~400px next to the count. The label stays
 * in the DOM as screen-reader text, so the button keeps its accessible name.
 */
export function SelectionAction({ icon, label, className, ...props }: SelectionActionProps) {
  return (
    <Button size="sm" className={cn("max-sm:w-9 max-sm:px-0", className)} {...props}>
      {icon}
      <span className="max-sm:sr-only">{label}</span>
    </Button>
  );
}
