"use client";

import { useEffect, useState } from "react";
import { motion, useAnimationControls } from "framer-motion";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

type AnimatedStarProps = {
  starred: boolean;
  className?: string;
  /** Classes for the unstarred outline (e.g. text-white over a photo). */
  outlineClassName?: string;
};

/**
 * The "like button" star: becoming starred pops it (quick scale-up, then a
 * spring settle) while the amber fill fades in; unstarring only fades back to
 * the outline, no bounce. Starring is optimistic, so the pop plays on click.
 */
export function AnimatedStar({ starred, className, outlineClassName }: AnimatedStarProps) {
  // Animation controls rather than useAnimate: useAnimate reads the device's
  // reduced-motion setting itself and logs a dev warning when it's on. The
  // global skipAnimations switch (MotionProvider) already makes this instant.
  const controls = useAnimationControls();
  // Counts transitions into "starred" - derived during render (no effect
  // round-trip), and the effect below replays the pop whenever it moves.
  const [popCount, setPopCount] = useState(0);
  const [prevStarred, setPrevStarred] = useState(starred);
  if (starred !== prevStarred) {
    setPrevStarred(starred);
    if (starred) setPopCount((count) => count + 1);
  }

  useEffect(() => {
    if (popCount === 0) return;
    let cancelled = false;
    controls.start({ scale: 1.3, transition: { duration: 0.1, ease: "easeOut" } }).then(() => {
      if (!cancelled) controls.start({ scale: 1, transition: { type: "spring", stiffness: 400, damping: 10 } });
    });
    return () => {
      cancelled = true;
    };
  }, [popCount, controls]);

  return (
    <motion.span animate={controls} className="inline-flex">
      <Star
        className={cn(
          "transition-[color,fill] duration-200",
          starred ? "fill-amber-400 text-amber-400" : cn("fill-transparent", outlineClassName),
          className,
        )}
      />
    </motion.span>
  );
}
