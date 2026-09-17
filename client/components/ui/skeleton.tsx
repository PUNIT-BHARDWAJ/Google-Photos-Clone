import { cn } from "cn"

// A soft band sweeps across the block (slightly darker in light mode, where
// muted is already near-white; lighter in dark mode). The sweep is a pseudo-element
// moved with transform (animate-shimmer), so it runs on the compositor rather
// than repainting a moving background-position every frame.
function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn(
        "relative overflow-hidden rounded-2xl bg-muted after:absolute after:inset-0 after:-translate-x-full after:animate-shimmer after:bg-linear-to-r after:from-transparent after:via-foreground/10 after:to-transparent dark:after:via-white/10",
        className
      )}
      {...props}
    />
  )
}

export { Skeleton }
