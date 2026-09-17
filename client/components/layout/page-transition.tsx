"use client";

import { useContext, useState } from "react";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { LayoutRouterContext } from "next/dist/shared/lib/app-router-context.shared-runtime";

// By the time AnimatePresence starts an exit, the App Router has already
// swapped in the next route's segment - so the outgoing page would fade out
// showing the *new* page's content. Holding on to the router context from
// when this page mounted keeps the old segment rendered until its exit ends.
function FrozenRouter({ children }: { children: React.ReactNode }) {
  const context = useContext(LayoutRouterContext);
  const [frozen] = useState(context);
  if (!frozen) return <>{children}</>;
  return <LayoutRouterContext.Provider value={frozen}>{children}</LayoutRouterContext.Provider>;
}

/**
 * Subtle fade + 8px slide between routes. Keyed by pathname, so query-string
 * changes (typing a search) don't replay it. mode="wait" lets the old page
 * finish leaving before the new one comes in, so two pages never overlap.
 */
export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={pathname}
        // Raw `transform` (not `y`) so it runs on the compositor alongside
        // the opacity fade, unaffected by the incoming page's render work.
        // Cleared once settled: a leftover translateY(0px) would still make
        // this wrapper the containing block for any position:fixed content.
        initial={{ opacity: 0, transform: "translateY(8px)" }}
        animate={{ opacity: 1, transform: "translateY(0px)", transitionEnd: { transform: "none" } }}
        exit={{ opacity: 0, transform: "translateY(-8px)" }}
        transition={{ duration: 0.2, ease: "easeOut" }}
      >
        <FrozenRouter>{children}</FrozenRouter>
      </motion.div>
    </AnimatePresence>
  );
}
