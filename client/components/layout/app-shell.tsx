"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { SearchBar } from "@/components/layout/search-bar";
import { PageTransition } from "@/components/layout/page-transition";
import { SidebarNav } from "@/components/layout/sidebar-nav";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { UploadDropOverlay } from "@/components/uploads/upload-drop-overlay";
import { UploadFab } from "@/components/uploads/upload-fab";
import { UploadManagerPanel } from "@/components/uploads/upload-manager-panel";
import { useCurrentUser } from "@/hooks/use-auth";
import { useStorageUsage } from "@/hooks/use-library";
import { useIsMobile } from "@/hooks/use-mobile";
import { useUploadQueue } from "@/hooks/use-upload-queue";
import { cn } from "@/lib/utils";

type AppShellProps = {
  children: React.ReactNode;
};

// Upload (drop zone + FAB) only makes sense where photos actually live -
// not on /settings, /shared-links, the bare /albums list, or the public
// /shared/{token} view (which isn't even wrapped by AppShell).
function isUploadRoute(pathname: string) {
  if (pathname === "/photos" || pathname === "/favorites" || pathname === "/search") return true;
  return /^\/albums\/[^/]+$/.test(pathname);
}

export function AppShell({ children }: AppShellProps) {
  const { data: user } = useCurrentUser();
  const isMobile = useIsMobile();
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const uploadEnabled = isUploadRoute(pathname);
  const uploadQueue = useUploadQueue();
  const { data: storage } = useStorageUsage();

  // Overall progress for the FAB's ring. Failed rows don't count, and a file
  // tops out at 90% until the server confirms it: XHR reports 100% as soon as
  // the bytes are sent, well before ImageKit has finished processing.
  const uploadItems = uploadQueue.items.filter((item) => item.status !== "error");
  const uploadsActive = uploadItems.some((item) => item.status === "pending" || item.status === "uploading");
  const uploadProgress = uploadsActive
    ? Math.round(
        uploadItems.reduce((sum, item) => sum + (item.status === "done" ? 100 : Math.min(item.progress, 90)), 0) /
          uploadItems.length,
      )
    : null;
  const uploadsCompleted = uploadItems.some((item) => item.status === "done");

  return (
    <div className="min-h-screen bg-background">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-border bg-sidebar md:block">
        <SidebarNav user={user} />
      </aside>

      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="h-full w-72 border-r border-border bg-sidebar p-0">
          <SheetHeader className="sr-only">
            <SheetTitle>Navigation</SheetTitle>
          </SheetHeader>
          <SidebarNav user={user} onNavigate={() => setMobileOpen(false)} />
        </SheetContent>
      </Sheet>

      <div className="flex min-h-screen flex-col md:pl-64">
        <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-border/60 bg-background/90 px-4 py-3 backdrop-blur-sm sm:px-6">
          {isMobile && (
            <Button
              variant="outline"
              size="icon-sm"
              className="shrink-0"
              onClick={() => setMobileOpen(true)}
              aria-label="Open navigation"
            >
              <Menu className="size-4" />
            </Button>
          )}
          <SearchBar />
        </header>

        <UploadDropOverlay enabled={uploadEnabled} onFiles={uploadQueue.addFiles}>
          {/* Extra bottom padding where the FAB is shown (56px + bottom-6), so
              the last row of photos can scroll clear of it instead of having
              its bottom-right tile's star permanently covered. */}
          <main className={cn("px-4 py-6 sm:px-6 sm:py-8 lg:px-8", uploadEnabled && "pb-24 sm:pb-24")}>
            <PageTransition>{children}</PageTransition>
          </main>
        </UploadDropOverlay>
      </div>

      {uploadEnabled && (
        <UploadFab
          onFiles={uploadQueue.addFiles}
          progress={uploadProgress}
          completed={uploadsCompleted}
          pulse={storage?.libraryPhotoCount === 0}
        />
      )}
      <UploadManagerPanel items={uploadQueue.items} onRetry={uploadQueue.retry} onDismiss={uploadQueue.dismiss} />
    </div>
  );
}