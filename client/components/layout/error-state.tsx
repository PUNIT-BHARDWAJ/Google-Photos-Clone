"use client";

import { CircleAlert, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Spinner } from "@/components/ui/spinner";
import { isNetworkError } from "@/lib/api";
import { cn } from "@/lib/utils";

type ErrorStateProps = {
  error?: unknown;
  title?: string;
  onRetry?: () => void;
  retrying?: boolean;
  /** Compact single-line version for use inside a card rather than a page. */
  inline?: boolean;
  className?: string;
};

// Only a connection failure gets a specific explanation. Other messages come
// straight from the server and aren't written for a page-level state.
function describe(error: unknown) {
  if (isNetworkError(error)) {
    return "We couldn't reach the server. Check your connection and try again.";
  }
  return "We couldn't load this right now. Please try again.";
}

/**
 * What a page shows when its data request fails - instead of falling through
 * to the empty state, which would claim "No photos yet" during an outage.
 */
export function ErrorState({
  error,
  title = "Something went wrong",
  onRetry,
  retrying = false,
  inline = false,
  className,
}: ErrorStateProps) {
  const retryButton = onRetry && (
    <Button variant="outline" size={inline ? "sm" : "default"} onClick={onRetry} disabled={retrying}>
      {retrying ? <Spinner /> : <RefreshCw />}
      Try again
    </Button>
  );

  if (inline) {
    return (
      <div role="alert" className={cn("flex flex-wrap items-center justify-between gap-3", className)}>
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <CircleAlert className="size-4 shrink-0 text-destructive" />
          {describe(error)}
        </p>
        {retryButton}
      </div>
    );
  }

  return (
    <Empty role="alert" className={className}>
      <EmptyHeader>
        <EmptyMedia variant="icon" className="bg-destructive/10 text-destructive">
          <CircleAlert />
        </EmptyMedia>
        <EmptyTitle>{title}</EmptyTitle>
        <EmptyDescription>{describe(error)}</EmptyDescription>
      </EmptyHeader>
      {retryButton && <EmptyContent>{retryButton}</EmptyContent>}
    </Empty>
  );
}
