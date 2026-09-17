"use client";

import { AnimatePresence, motion, type Transition } from "framer-motion";
import { RiCloseLine } from "@remixicon/react";
import { Button } from "@/components/ui/button";
import { AnimatedNumber } from "@/components/ui/animated-number";

/** 60px app header + this 56px toolbar - what sticky day headings sit below. */
export const TOOLBAR_STICKY_OFFSET = "116px";

const SWAP_TRANSITION: Transition = {
  y: { type: "spring", stiffness: 400, damping: 35 },
  opacity: { duration: 0.15 },
};

type PhotoToolbarProps = {
  /** Left side while nothing is selected - filter chips, or nothing. */
  children?: React.ReactNode;
  /** Right side while nothing is selected - density and sort. */
  controls?: React.ReactNode;
  selectionCount: number;
  onClearSelection: () => void;
  /** What can be done with the selection on this page. */
  selectionActions: React.ReactNode;
};

/**
 * The bar pinned under the header on every photo grid. Normally it holds the
 * page's filters and view controls; selecting photos swaps it for the
 * selection count and the actions that make sense on this page - the default
 * bar slides up and out as the selection bar slides up into place.
 */
export function PhotoToolbar({ children, controls, selectionCount, onClearSelection, selectionActions }: PhotoToolbarProps) {
  const selecting = selectionCount > 0;

  return (
    <div className="glass-chip-bar sticky top-[60px] z-20 -mx-4 mb-4 h-14 overflow-hidden border-b border-border/60 sm:-mx-6 lg:-mx-8">
      <AnimatePresence mode="popLayout" initial={false}>
        {selecting ? (
          <motion.div
            key="selection"
            className="flex h-full items-center justify-between gap-3 px-4 sm:px-6 lg:px-8"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -20, opacity: 0 }}
            transition={SWAP_TRANSITION}
          >
            <div className="flex shrink-0 items-center gap-2">
              <Button variant="ghost" size="icon-sm" onClick={onClearSelection} aria-label="Clear selection">
                <RiCloseLine className="size-4" />
              </Button>
              <span className="flex items-baseline gap-1 text-sm font-medium text-foreground" aria-live="polite">
                <AnimatedNumber value={selectionCount} />
                selected
              </span>
            </div>
            {/* Actions go icon-only below `sm` (see SelectionAction); the
                overflow scroll is only a safety net for a longer set. */}
            <div className="scrollbar-none flex min-w-0 items-center gap-1.5 overflow-x-auto">{selectionActions}</div>
          </motion.div>
        ) : (
          <motion.div
            key="default"
            className="flex h-full items-center gap-2 pr-4 sm:pr-6 lg:pr-8"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -20, opacity: 0 }}
            transition={SWAP_TRANSITION}
          >
            <div className="flex min-w-0 flex-1 items-center pl-1 sm:pl-3 lg:pl-5">{children}</div>
            {controls}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
