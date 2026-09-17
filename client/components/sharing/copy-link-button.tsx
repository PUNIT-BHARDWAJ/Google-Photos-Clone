"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Copy } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const FLASH_MS = 200;
const COPIED_MS = 2000;

type CopyLinkButtonProps = {
  url: string;
  size?: "sm" | "default";
  className?: string;
};

/**
 * Copy button whose feedback lives on the button itself: the label swaps to
 * "Copied!" with a check, the background flashes green for 200ms, and it
 * reverts after 2s. Only a failed copy falls back to a toast.
 */
export function CopyLinkButton({ url, size = "default", className }: CopyLinkButtonProps) {
  // Bumped per successful copy; the effect below owns the flash/revert timers
  // for the latest one, so rapid clicks restart the sequence cleanly.
  const [copyCount, setCopyCount] = useState(0);
  const [copied, setCopied] = useState(false);
  const [flash, setFlash] = useState(false);

  useEffect(() => {
    if (copyCount === 0) return;
    const flashTimer = setTimeout(() => setFlash(false), FLASH_MS);
    const copiedTimer = setTimeout(() => setCopied(false), COPIED_MS);
    return () => {
      clearTimeout(flashTimer);
      clearTimeout(copiedTimer);
    };
  }, [copyCount]);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      toast.error("Couldn't copy the link");
      return;
    }
    setCopied(true);
    setFlash(true);
    setCopyCount((count) => count + 1);
  }

  return (
    <Button
      type="button"
      variant="outline"
      size={size === "sm" ? "sm" : "default"}
      onClick={handleCopy}
      aria-label={copied ? "Link copied" : "Copy link"}
      className={cn(
        // Fixed min width so "Copy" -> "Copied!" doesn't shift the layout.
        "min-w-24 overflow-hidden transition-[background-color,border-color,color,scale] duration-200",
        copied && "border-green-500/50 text-green-700 hover:text-green-700 dark:text-green-400 dark:hover:text-green-400",
        // hover: variants too - the pointer is still on the button right after
        // the click, and the outline variant's hover:bg-muted would win.
        flash && "bg-green-500/20 hover:bg-green-500/20 dark:bg-green-500/25 dark:hover:bg-green-500/25",
        className,
      )}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={copied ? "copied" : "copy"}
          className="inline-flex items-center gap-1.5"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.12, ease: "easeOut" }}
        >
          {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
          {copied ? "Copied!" : "Copy"}
        </motion.span>
      </AnimatePresence>
    </Button>
  );
}
