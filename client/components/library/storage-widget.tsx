"use client";

import { RiCloudLine } from "@remixicon/react";
import { Progress } from "@/components/ui/progress";
import { formatBytes } from "@/lib/format";
import { useStorageUsage } from "@/hooks/use-library";

// The backend doesn't report a storage quota, so we display Google Photos'
// standard free-tier allowance purely as a visual reference point.
const DISPLAY_QUOTA_BYTES = 15 * 1024 ** 3;

export function StorageWidget() {
  const { data, isLoading } = useStorageUsage();

  if (isLoading || !data) {
    return null;
  }

  const percent = Math.min(100, (data.libraryUsedBytes / DISPLAY_QUOTA_BYTES) * 100);

  return (
    <div className="space-y-2 rounded-xl bg-sidebar-foreground/[0.04] px-3 py-2.5">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <RiCloudLine className="size-3.5 shrink-0" />
        <span className="truncate">
          {formatBytes(data.libraryUsedBytes)} of {formatBytes(DISPLAY_QUOTA_BYTES)} used
        </span>
      </div>
      <Progress value={percent} className="[&_[data-slot=progress-track]]:h-1.5" />
    </div>
  );
}
