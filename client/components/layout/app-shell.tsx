"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { animate, motion, useMotionValue, useTransform, type Transition } from "framer-motion";
import { Menu } from "lucide-react";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { MobileBottomNav } from "@/components/layout/mobile-bottom-nav";
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
import { useHideOnScroll } from "@/hooks/use-hide-on-scroll";
import { useStorageUsage } from "@/hooks/use-library";
import { useIsMobile } from "@/hooks/use-mobile";
import { useStoredState } from "@/hooks/use-stored-state";
import { useUploadQueue } from "@/hooks/use-upload-queue";
import { cn } from "@/lib/utils";

const SIDEBAR_EXPANDED = 240;
const SIDEBAR_COLLAPSED = 64;
const SIDEBAR_SPRING: Transition = { type: "spring", stiffness: 300, damping: 28 };

function parseBoolean(value: unknown) {
  return typeof value === "boolean" ? value : undefined;
}

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

/**
 * The sidebar's width on a spring, and the content column following it.
 *
 * Only the sidebar animates its width. The content column takes its final
 * offset (and so its final width) straight away and slides there with a
 * transform driven by the same motion value - so the two can't drift apart,
 * the photo grid lays out once rather than on every frame, and each frame is
 * a composite instead of a full-page layout. The far edge is clipped while it
 * slides.
 */
function useSidebarWidth(target: number, contentRef: React.RefObject<HTMLDivElement | null>) {
  const width = useMotionValue(target);
  const offset = useMotionValue(target);

  useEffect(() => {
    offset.set(target);
    if (width.get() === target) return;
    const content = contentRef.current;
    // Promoted to its own layer only for the length of the slide.
    if (content) content.style.willChange = "transform";
    const release = () => {
      if (content) content.style.willChange = "";
    };
    const controls = animate(width, target, { ...SIDEBAR_SPRING, onComplete: release });
    return () => {
      controls.stop();
      release();
    };
  }, [target, width, offset, contentRef]);

  const contentX = useTransform(() => width.get() - offset.get());
  return { width, offset, contentX };
}

export function AppShell({ children }: AppShellProps) {
  const { data: user } = useCurrentUser();
  const isMobile = useIsMobile();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useStoredState("gp-sidebar-collapsed", false, parseBoolean);
  const pathname = usePathname();
  const uploadEnabled = isUploadRoute(pathname);
  const uploadQueue = useUploadQueue();
  const { data: storage } = useStorageUsage();
  const navHidden = useHideOnScroll(isMobile);

  const contentRef = useRef<HTMLDivElement>(null);
  const sidebar = useSidebarWidth(collapsed ? SIDEBAR_COLLAPSED : SIDEBAR_EXPANDED, contentRef);

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
    <div className="min-h-screen overflow-x-clip bg-background">
      {!isMobile && (
        <motion.aside className="glass-sidebar fixed inset-y-0 left-0 z-30 overflow-hidden" style={{ width: sidebar.width }}>
          <SidebarNav user={user} collapsed={collapsed} onToggleCollapsed={() => setCollapsed((value) => !value)} />
        </motion.aside>
      )}

      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="h-full w-72 border-r border-border bg-sidebar p-0">
          <SheetHeader className="sr-only">
            <SheetTitle>Navigation</SheetTitle>
          </SheetHeader>
          <SidebarNav user={user} onNavigate={() => setMobileOpen(false)} />
        </SheetContent>
      </Sheet>

      <motion.div
        ref={contentRef}
        className="flex min-h-screen flex-col"
        style={isMobile ? undefined : { paddingLeft: sidebar.offset, x: sidebar.contentX }}
      >
        {/* z-30: above the pages' sticky toolbars (z-20), so the search suggestions drop over them. */}
        <header className="glass-header sticky top-0 z-30 flex h-[60px] items-center gap-3 px-4 sm:px-6">
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
          {/* Extra bottom padding so the last row of photos can scroll clear
              of what floats over it: the FAB on desktop, and on phones the
              bottom bar plus the FAB sitting above it. */}
          <main
            className={cn(
              "px-4 py-6 sm:px-6 sm:py-8 lg:px-8",
              isMobile
                ? uploadEnabled
                  ? "pb-40 sm:pb-40"
                  : "pb-24 sm:pb-24"
                : uploadEnabled && "pb-24 sm:pb-24",
            )}
          >
            <Breadcrumbs />
            <PageTransition>{children}</PageTransition>
          </main>
        </UploadDropOverlay>
      </motion.div>

      {uploadEnabled && (
        <UploadFab
          onFiles={uploadQueue.addFiles}
          progress={uploadProgress}
          completed={uploadsCompleted}
          pulse={storage?.libraryPhotoCount === 0}
          navHidden={navHidden}
        />
      )}
      {isMobile && <MobileBottomNav hidden={navHidden} onUploadFiles={uploadQueue.addFiles} />}
      <UploadManagerPanel items={uploadQueue.items} onRetry={uploadQueue.retry} onDismiss={uploadQueue.dismiss} />
    </div>
  );
}
