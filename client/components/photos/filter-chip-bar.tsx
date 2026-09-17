"use client";

import { useEffect, useId, useRef } from "react";
import { LayoutGroup, motion, useAnimationControls, useReducedMotion, type Transition } from "framer-motion";
import type { RemixiconComponentType } from "@remixicon/react";
import { Ripples, useRipples } from "@/components/ui/ripple";
import { cn } from "@/lib/utils";

export type FilterChip = {
  key: string;
  label: string;
  icon?: RemixiconComponentType;
  count?: number;
};

const INDICATOR_SPRING: Transition = { type: "spring", stiffness: 500, damping: 30, mass: 0.5 };
const SETTLE_SPRING: Transition = { type: "spring", stiffness: 500, damping: 20 };

type ChipProps = {
  chip: FilterChip;
  active: boolean;
  focusable: boolean;
  onSelect: () => void;
  onArrow: (direction: 1 | -1) => void;
  registerRef: (node: HTMLButtonElement | null) => void;
};

function Chip({ chip, active, focusable, onSelect, onArrow, registerRef }: ChipProps) {
  const controls = useAnimationControls();
  const { ripples, onPointerDown, remove } = useRipples();
  const Icon = chip.icon;

  // Becoming active: a tiny swell that springs back.
  useEffect(() => {
    if (!active) return;
    controls.set({ scale: 1.02 });
    void controls.start({ scale: 1, transition: SETTLE_SPRING });
  }, [active, controls]);

  return (
    <motion.button
      ref={registerRef}
      type="button"
      role="radio"
      aria-checked={active}
      tabIndex={focusable ? 0 : -1}
      animate={controls}
      onPointerDown={onPointerDown}
      onClick={onSelect}
      onKeyDown={(event) => {
        if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
          event.preventDefault();
          onArrow(event.key === "ArrowRight" ? 1 : -1);
        }
      }}
      className={cn(
        "relative flex h-8 shrink-0 items-center gap-1.5 rounded-full border px-3 text-sm font-medium whitespace-nowrap outline-none transition-[color,border-color,opacity] duration-200 focus-visible:ring-2 focus-visible:ring-ring",
        active
          ? "border-primary/30 text-primary"
          : "border-border text-foreground opacity-70 hover:opacity-100",
      )}
    >
      {active && (
        <motion.span
          layoutId="chip-indicator"
          aria-hidden
          className="absolute inset-0 rounded-full bg-primary/10"
          transition={INDICATOR_SPRING}
        />
      )}
      <Ripples ripples={ripples} onDone={remove} />
      {Icon && <Icon className="relative size-4" />}
      <span className="relative">{chip.label}</span>
      {chip.count !== undefined && (
        <span className={cn("relative text-xs tabular-nums", active ? "text-primary/80" : "text-muted-foreground")}>
          {chip.count}
        </span>
      )}
    </motion.button>
  );
}

type FilterChipBarProps = {
  chips: FilterChip[];
  activeKey: string;
  onSelect: (key: string) => void;
  label: string;
};

/**
 * A horizontally scrolling row of single-choice filter chips. The highlight
 * slides between chips, the chosen chip scrolls to the middle of the row, and
 * arrow keys move between chips (one tab stop for the whole group).
 */
export function FilterChipBar({ chips, activeKey, onSelect, label }: FilterChipBarProps) {
  const refs = useRef(new Map<string, HTMLButtonElement>());
  const reducedMotion = useReducedMotion();
  const layoutGroupId = useId();

  useEffect(() => {
    refs.current.get(activeKey)?.scrollIntoView({
      behavior: reducedMotion ? "auto" : "smooth",
      inline: "center",
      block: "nearest",
    });
  }, [activeKey, reducedMotion]);

  function move(from: number, direction: 1 | -1) {
    const next = chips[(from + direction + chips.length) % chips.length];
    onSelect(next.key);
    refs.current.get(next.key)?.focus();
  }

  return (
    <LayoutGroup id={layoutGroupId}>
      <div
        role="radiogroup"
        aria-label={label}
        className="scrollbar-none flex min-w-0 flex-1 items-center gap-2 overflow-x-auto py-1 [mask-image:linear-gradient(to_right,transparent,black_12px,black_calc(100%-24px),transparent)] px-3"
      >
        {chips.map((chip, index) => (
          <Chip
            key={chip.key}
            chip={chip}
            active={chip.key === activeKey}
            focusable={chip.key === activeKey}
            onSelect={() => onSelect(chip.key)}
            onArrow={(direction) => move(index, direction)}
            registerRef={(node) => {
              if (node) refs.current.set(chip.key, node);
              else refs.current.delete(chip.key);
            }}
          />
        ))}
      </div>
    </LayoutGroup>
  );
}
