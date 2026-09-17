"use client";

import { useId, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, LayoutGroup, motion, type Transition } from "framer-motion";
import {
  RiFolderImageFill,
  RiFolderImageLine,
  RiImageFill,
  RiImageLine,
  RiSearchFill,
  RiSearchLine,
  RiStarFill,
  RiStarLine,
  RiUploadCloud2Fill,
  RiUploadCloud2Line,
  type RemixiconComponentType,
} from "@remixicon/react";
import { ACCEPTED_UPLOAD_TYPES } from "@/components/uploads/upload-fab";
import { cn } from "@/lib/utils";

export const BOTTOM_NAV_HEIGHT = 64;
export const FOCUS_SEARCH_EVENT = "gp:focus-search";

// Fast out, slower settle - the bar drops away like it's pulled down.
export const BOTTOM_NAV_SPRING: Transition = { type: "spring", stiffness: 400, damping: 35 };
const INDICATOR_SPRING: Transition = { type: "spring", stiffness: 500, damping: 30, mass: 0.5 };
// Released icons overshoot to ~1.1 before settling.
const PRESS_SPRING: Transition = { type: "spring", stiffness: 700, damping: 14 };

type Tab = {
  key: string;
  label: string;
  icon: RemixiconComponentType;
  activeIcon: RemixiconComponentType;
  href?: string;
};

const TABS: Tab[] = [
  { key: "photos", label: "Photos", href: "/photos", icon: RiImageLine, activeIcon: RiImageFill },
  { key: "search", label: "Search", href: "/search", icon: RiSearchLine, activeIcon: RiSearchFill },
  { key: "upload", label: "Upload", icon: RiUploadCloud2Line, activeIcon: RiUploadCloud2Fill },
  { key: "favorites", label: "Favorites", href: "/favorites", icon: RiStarLine, activeIcon: RiStarFill },
  { key: "albums", label: "Albums", href: "/albums", icon: RiFolderImageLine, activeIcon: RiFolderImageFill },
];

type Ripple = { id: number; x: number; y: number };

type TabItemProps = {
  tab: Tab;
  active: boolean;
  onPress: () => void;
};

function TabItem({ tab, active, onPress }: TabItemProps) {
  const [ripples, setRipples] = useState<Ripple[]>([]);
  const Icon = active ? tab.activeIcon : tab.icon;

  const content = (
    <>
      {/* Material-style ink: a soft circle spreading from where the finger landed. */}
      <span aria-hidden className="pointer-events-none absolute inset-x-2 inset-y-1 overflow-hidden rounded-2xl">
        <AnimatePresence>
          {ripples.map((ripple) => (
            <motion.span
              key={ripple.id}
              className="absolute size-16 rounded-full bg-primary/20"
              style={{ left: ripple.x - 32, top: ripple.y - 32 }}
              initial={{ scale: 0, opacity: 1 }}
              animate={{ scale: 2.4, opacity: 0 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              onAnimationComplete={() => setRipples((current) => current.filter((item) => item.id !== ripple.id))}
            />
          ))}
        </AnimatePresence>
      </span>

      <motion.span
        className="relative flex size-7 items-center justify-center"
        whileTap={{ scale: 0.85 }}
        transition={PRESS_SPRING}
        style={active ? { filter: "drop-shadow(0 0 4px rgba(var(--primary-rgb), 0.3))" } : undefined}
      >
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span
            key={active ? "filled" : "outline"}
            className="flex"
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.6, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
            <Icon className="size-6" />
          </motion.span>
        </AnimatePresence>
      </motion.span>
      <span className="relative text-[11px] leading-none font-medium">{tab.label}</span>
      {active && (
        <motion.span
          layoutId="bottom-nav-indicator"
          aria-hidden
          className="absolute bottom-1 h-1 w-1 rounded-full bg-primary"
          transition={INDICATOR_SPRING}
        />
      )}
    </>
  );

  const className = cn(
    "relative flex h-full w-full flex-col items-center justify-center gap-1 outline-none select-none [-webkit-tap-highlight-color:transparent] focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring",
    active ? "text-primary" : "text-muted-foreground",
  );

  function handlePointerDown(event: React.PointerEvent<HTMLElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    // Relative to the ink area, which is inset 8px/4px inside the tab.
    setRipples((current) => [
      ...current,
      { id: event.timeStamp, x: event.clientX - rect.left - 8, y: event.clientY - rect.top - 4 },
    ]);
  }

  if (tab.href) {
    return (
      <Link
        href={tab.href}
        aria-current={active ? "page" : undefined}
        className={className}
        onPointerDown={handlePointerDown}
        onClick={onPress}
      >
        {content}
      </Link>
    );
  }
  return (
    <button type="button" className={className} onPointerDown={handlePointerDown} onClick={onPress}>
      {content}
    </button>
  );
}

type MobileBottomNavProps = {
  hidden: boolean;
  onUploadFiles: (files: File[]) => void;
};

/** Phone navigation: five thumb-reachable tabs on a glass bar that slides away while scrolling down. */
export function MobileBottomNav({ hidden, onUploadFiles }: MobileBottomNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const layoutGroupId = useId();

  function isActive(tab: Tab) {
    return !!tab.href && pathname.startsWith(tab.href);
  }

  function handlePress(tab: Tab) {
    if (tab.key === "upload") {
      inputRef.current?.click();
    } else if (tab.key === "search") {
      // The search field lives in the header; put the cursor in it.
      if (pathname !== "/search") router.push("/search");
      window.dispatchEvent(new Event(FOCUS_SEARCH_EVENT));
    }
  }

  return (
    <motion.nav
      aria-label="Primary"
      className="glass-bottom-nav fixed inset-x-0 bottom-0 z-40 pb-[env(safe-area-inset-bottom)] md:hidden"
      initial={false}
      animate={{ y: hidden ? BOTTOM_NAV_HEIGHT + 8 : 0 }}
      transition={BOTTOM_NAV_SPRING}
    >
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_UPLOAD_TYPES}
        multiple
        className="hidden"
        onChange={(event) => {
          const files = Array.from(event.target.files ?? []);
          if (files.length) onUploadFiles(files);
          event.target.value = "";
        }}
      />
      <LayoutGroup id={layoutGroupId}>
        <ul className="grid grid-cols-5" style={{ height: BOTTOM_NAV_HEIGHT }}>
          {TABS.map((tab) => (
            <li key={tab.key} className="h-full">
              <TabItem tab={tab} active={isActive(tab)} onPress={() => handlePress(tab)} />
            </li>
          ))}
        </ul>
      </LayoutGroup>
    </motion.nav>
  );
}
