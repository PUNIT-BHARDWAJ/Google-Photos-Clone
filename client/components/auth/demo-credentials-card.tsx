"use client";

import { AnimatePresence, motion } from "framer-motion";
import { RiCloseLine } from "@remixicon/react";
import { useStoredState } from "@/hooks/use-stored-state";
import { DEMO_EMAIL, DEMO_PASSWORD, demoAccountAvailable } from "@/lib/demo";

const DISMISSED_KEY = "gp-demo-hint-dismissed";

function parseBoolean(value: unknown) {
  return typeof value === "boolean" ? value : undefined;
}

type DemoCredentialsCardProps = {
  /** Fills the sign-in form rather than signing in, so the visitor stays in control. */
  onUse: (email: string, password: string) => void;
};

/**
 * Points visitors at the shared demo account. Quiet by design: this sits under
 * the sign-in form, not over it, and stays dismissed once closed.
 */
export function DemoCredentialsCard({ onUse }: DemoCredentialsCardProps) {
  const [dismissed, setDismissed] = useStoredState(DISMISSED_KEY, false, parseBoolean);

  if (!demoAccountAvailable()) return null;

  return (
    <AnimatePresence initial={false}>
      {!dismissed && (
        <motion.div
          key="demo-hint"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="overflow-hidden"
        >
          <div className="relative rounded-2xl border border-border/60 bg-muted/40 p-3 pr-9 text-sm">
            <button
              type="button"
              onClick={() => setDismissed(true)}
              aria-label="Hide the demo account hint"
              className="absolute top-2 right-2 rounded-md p-1 text-muted-foreground transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
            >
              <RiCloseLine className="size-4" />
            </button>

            <p className="text-muted-foreground">
              Just looking around?{" "}
              <button
                type="button"
                onClick={() => onUse(DEMO_EMAIL, DEMO_PASSWORD)}
                className="rounded-sm font-medium text-foreground underline decoration-dotted underline-offset-4 transition-colors hover:text-primary focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
              >
                Use the demo account
              </button>
            </p>
            <p className="mt-1 font-mono text-xs text-muted-foreground">
              {DEMO_EMAIL} · {DEMO_PASSWORD}
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
