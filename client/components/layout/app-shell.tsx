"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { SearchBar } from "@/components/layout/search-bar";
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
            {children}
          </main>
        </UploadDropOverlay>
      </div>

      {uploadEnabled && <UploadFab onFiles={uploadQueue.addFiles} />}
      <UploadManagerPanel items={uploadQueue.items} onRetry={uploadQueue.retry} onDismiss={uploadQueue.dismiss} />
    </div>
  );
}