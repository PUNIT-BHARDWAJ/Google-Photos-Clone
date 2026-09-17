"use client";

import { useCallback, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";

type Ripple = { id: number; x: number; y: number; size: number };

/**
 * Ink ripples: call `onPointerDown` from the pressable element (which must be
 * `relative`), and render `<Ripples>` inside it. Each press spreads a soft
 * circle from the exact point touched.
 */
export function useRipples() {
  const [ripples, setRipples] = useState<Ripple[]>([]);

  const onPointerDown = useCallback((event: React.PointerEvent<HTMLElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    // Big enough to cover the element from any starting point.
    const size = Math.hypot(rect.width, rect.height) * 2;
    setRipples((current) => [
      ...current,
      { id: event.timeStamp, x: event.clientX - rect.left, y: event.clientY - rect.top, size },
    ]);
  }, []);

  const remove = useCallback((id: number) => {
    setRipples((current) => current.filter((ripple) => ripple.id !== id));
  }, []);

  return { ripples, onPointerDown, remove };
}

type RipplesProps = {
  ripples: Ripple[];
  onDone: (id: number) => void;
  className?: string;
};

export function Ripples({ ripples, onDone, className }: RipplesProps) {
  return (
    <span aria-hidden className={cn("pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]", className)}>
      <AnimatePresence>
        {ripples.map((ripple) => (
          <motion.span
            key={ripple.id}
            className="absolute rounded-full bg-current opacity-15"
            style={{ left: ripple.x - ripple.size / 2, top: ripple.y - ripple.size / 2, width: ripple.size, height: ripple.size }}
            initial={{ scale: 0, opacity: 0.18 }}
            animate={{ scale: 1, opacity: 0 }}
            transition={{ duration: 0.55, ease: "easeOut" }}
            onAnimationComplete={() => onDone(ripple.id)}
          />
        ))}
      </AnimatePresence>
    </span>
  );
}
