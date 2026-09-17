"use client";

import { useState } from "react";
import { AnimatePresence, motion, type Variants } from "framer-motion";
import { cn } from "@/lib/utils";

const variants: Variants = {
  enter: (direction: number) => ({ y: direction * 10, opacity: 0 }),
  center: { y: 0, opacity: 1 },
  exit: (direction: number) => ({ y: direction * -10, opacity: 0 }),
};

type AnimatedNumberProps = {
  value: number;
  /** Displayed instead of larger values, e.g. 99 -> "99+". */
  max?: number;
  className?: string;
};

/**
 * An odometer-style number: when it changes, the old value slides out and the
 * new one slides in - upward when the number grows, downward when it shrinks.
 */
export function AnimatedNumber({ value, max, className }: AnimatedNumberProps) {
  const [previous, setPrevious] = useState(value);
  const [direction, setDirection] = useState(1);
  if (value !== previous) {
    setDirection(value > previous ? 1 : -1);
    setPrevious(value);
  }

  const label = max !== undefined && value > max ? `${max}+` : String(value);

  return (
    <span className={cn("relative inline-flex overflow-hidden tabular-nums", className)}>
      <AnimatePresence mode="popLayout" initial={false} custom={direction}>
        <motion.span
          key={label}
          custom={direction}
          variants={variants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="inline-block"
        >
          {label}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}
