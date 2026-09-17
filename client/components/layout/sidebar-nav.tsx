"use client";

import { useId } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { LayoutGroup, motion, type Transition } from "framer-motion";
import {
  Archive,
  FolderOpen,
  Images,
  Link2,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
  Star,
  Trash2,
} from "lucide-react";
import { useLogout } from "@/hooks/use-auth";
import { useLibraryCounts } from "@/hooks/use-library";
import { cn } from "@/lib/utils";
import { StorageWidget } from "@/components/library/storage-widget";
import { NavTooltip } from "@/components/layout/nav-tooltip";
import { AnimatedNumber } from "@/components/ui/animated-number";
import { ModeToggle } from "@/components/ui/mode-toggle";
import { Spinner } from "@/components/ui/spinner";
import type { LibraryCounts, User } from "@/lib/api";

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  count?: keyof LibraryCounts;
};

export const NAV_ITEMS: NavItem[] = [
  { href: "/photos", label: "Photos", icon: Images, count: "photos" },
  { href: "/favorites", label: "Favorites", icon: Star, count: "favorites" },
  { href: "/shared-links", label: "Shared Links", icon: Link2, count: "sharedLinks" },
  { href: "/albums", label: "Albums", icon: FolderOpen, count: "albums" },
  { href: "/archive", label: "Archive", icon: Archive, count: "archive" },
  { href: "/trash", label: "Trash", icon: Trash2, count: "trash" },
];

// A slightly-underdamped spring: the highlight glides to the new item and
// settles with a hint of overshoot, like Chrome's tab strip.
const INDICATOR_SPRING: Transition = { type: "spring", stiffness: 500, damping: 30, mass: 0.5 };
const ICON_HOVER_SPRING: Transition = { type: "spring", stiffness: 600, damping: 20 };

/**
 * Labels fade out before the rail narrows (fast, no delay) and back in only
 * once it has mostly widened (slower, delayed), so text never gets squeezed.
 */
function labelTransition(collapsed: boolean): Transition {
  return { duration: collapsed ? 0.1 : 0.2, delay: collapsed ? 0 : 0.1 };
}

function ActiveIndicator() {
  return (
    <motion.span
      layoutId="nav-indicator"
      aria-hidden
      className="absolute inset-0 rounded-lg bg-[linear-gradient(135deg,rgba(var(--primary-rgb),0.12),rgba(var(--primary-rgb),0.05))]"
      transition={INDICATOR_SPRING}
    >
      <span className="absolute inset-y-2 left-0 w-0.5 rounded-full bg-primary" />
    </motion.span>
  );
}

type NavLinkProps = NavItem & {
  isActive: boolean;
  collapsed: boolean;
  countValue?: number;
  onNavigate?: () => void;
};

function NavLink({ href, label, icon: Icon, isActive, collapsed, countValue, onNavigate }: NavLinkProps) {
  const showCount = countValue !== undefined && countValue > 0;

  return (
    <NavTooltip
      enabled={collapsed}
      label={showCount ? `${label} · ${countValue}` : label}
    >
      <Link
        href={href}
        onClick={onNavigate}
        aria-current={isActive ? "page" : undefined}
        className={cn(
          "group/nav relative flex h-10 items-center rounded-lg text-sm font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring",
          isActive
            ? "text-sidebar-accent-foreground"
            : "text-sidebar-foreground/80 hover:bg-sidebar-foreground/5 hover:text-sidebar-foreground",
        )}
      >
        {isActive && <ActiveIndicator />}
        {/* Fixed 40px icon column: at 64px wide (40px inside the padding) the
            icon sits dead centre, so narrowing the rail re-centres it without
            a jump. */}
        <motion.span
          className="relative flex size-10 shrink-0 items-center justify-center"
          whileHover={collapsed ? { scale: 1.15 } : undefined}
          transition={ICON_HOVER_SPRING}
        >
          <Icon
            className={cn(
              "size-[18px] transition-colors",
              !isActive && "text-muted-foreground group-hover/nav:text-sidebar-foreground",
            )}
          />
          {collapsed && showCount && (
            // Visual only - the count pill in the (faded) label still names the link.
            <motion.span
              aria-hidden
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 500, damping: 25 }}
              className="absolute -top-0.5 right-0 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] leading-none font-semibold text-primary-foreground ring-2 ring-background"
            >
              <AnimatedNumber value={countValue} max={99} />
            </motion.span>
          )}
        </motion.span>
        <motion.span
          className="relative flex min-w-0 flex-1 items-center gap-2 overflow-hidden pr-3 whitespace-nowrap"
          initial={false}
          animate={{ opacity: collapsed ? 0 : 1 }}
          transition={labelTransition(collapsed)}
        >
          <span className="truncate">{label}</span>
          {showCount && (
            <span
              className={cn(
                "ml-auto rounded-full px-1.5 text-xs font-medium",
                isActive ? "bg-primary/15 text-sidebar-accent-foreground" : "text-muted-foreground",
              )}
            >
              <AnimatedNumber value={countValue} />
            </span>
          )}
        </motion.span>
      </Link>
    </NavTooltip>
  );
}

type SidebarNavProps = {
  user?: User | null;
  onNavigate?: () => void;
  /** Icon-only rail. Only the desktop sidebar collapses; the mobile sheet never does. */
  collapsed?: boolean;
  onToggleCollapsed?: () => void;
};

export function SidebarNav({ user, onNavigate, collapsed = false, onToggleCollapsed }: SidebarNavProps) {
  const pathname = usePathname();
  const logoutMutation = useLogout();
  const { data: counts } = useLibraryCounts();
  // The desktop sidebar and the mobile sheet each render a SidebarNav; a group
  // per instance keeps their indicators from animating between each other.
  const layoutGroupId = useId();
  const labelMotion = { initial: false, animate: { opacity: collapsed ? 0 : 1 }, transition: labelTransition(collapsed) } as const;

  return (
    <LayoutGroup id={layoutGroupId}>
      <div className="flex h-full flex-col overflow-hidden">
        <div className="flex h-[68px] shrink-0 items-center gap-3 px-3">
          <Link
            href="/photos"
            onClick={onNavigate}
            aria-label="Google Photos Clone home"
            className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/15 outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Image src="/logo.svg" alt="" width={30} height={30} />
          </Link>
          <motion.div className="min-w-0 whitespace-nowrap" {...labelMotion}>
            <p className="truncate text-sm font-semibold text-sidebar-foreground">Google Photos</p>
            <p className="text-xs text-muted-foreground">Clone</p>
          </motion.div>
        </div>

        <div className="divider-fade mx-3 shrink-0" />

        <nav aria-label="Main" className="scrollbar-hover flex-1 space-y-1 overflow-y-auto px-3 py-3">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.href}
              {...item}
              isActive={pathname.startsWith(item.href)}
              collapsed={collapsed}
              countValue={item.count && counts ? counts[item.count] : undefined}
              onNavigate={onNavigate}
            />
          ))}
        </nav>

        <div className="divider-fade mx-3 shrink-0" />

        <div className="shrink-0 space-y-1 px-3 py-3">
          {!collapsed && (
            <motion.div {...labelMotion} className="pb-2">
              <StorageWidget />
            </motion.div>
          )}

          <NavLink
            href="/settings"
            label="Settings"
            icon={Settings}
            isActive={pathname.startsWith("/settings")}
            collapsed={collapsed}
            onNavigate={onNavigate}
          />

          {onToggleCollapsed && (
            <NavTooltip enabled={collapsed} label="Expand sidebar">
              <button
                type="button"
                onClick={onToggleCollapsed}
                aria-expanded={!collapsed}
                aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
                className="group/nav flex h-10 w-full items-center rounded-lg text-sm font-medium text-sidebar-foreground/80 outline-none transition-colors hover:bg-sidebar-foreground/5 hover:text-sidebar-foreground focus-visible:ring-2 focus-visible:ring-ring"
              >
                <motion.span
                  className="flex size-10 shrink-0 items-center justify-center"
                  whileHover={collapsed ? { scale: 1.15 } : undefined}
                  transition={ICON_HOVER_SPRING}
                >
                  {collapsed ? (
                    <PanelLeftOpen className="size-[18px] text-muted-foreground group-hover/nav:text-sidebar-foreground" />
                  ) : (
                    <PanelLeftClose className="size-[18px] text-muted-foreground group-hover/nav:text-sidebar-foreground" />
                  )}
                </motion.span>
                <motion.span className="truncate whitespace-nowrap" {...labelMotion}>
                  Collapse
                </motion.span>
              </button>
            </NavTooltip>
          )}

          {user && (
            <NavTooltip
              enabled={collapsed}
              label={
                <span className="flex flex-col">
                  <span>{user.displayName}</span>
                  <span className="font-normal opacity-70">{user.email}</span>
                </span>
              }
            >
              <div className="flex h-12 items-center rounded-lg">
                <span className="flex size-10 shrink-0 items-center justify-center">
                  <span
                    aria-hidden
                    className="flex size-8 items-center justify-center rounded-full bg-primary/15 text-sm font-semibold text-sidebar-accent-foreground ring-2 ring-sidebar-border"
                  >
                    {(user.displayName || user.email).trim().charAt(0).toUpperCase()}
                  </span>
                </span>
                <motion.div className="min-w-0 pl-1 whitespace-nowrap" {...labelMotion}>
                  <p className="truncate text-sm font-medium text-sidebar-foreground">{user.displayName}</p>
                  <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                </motion.div>
              </div>
            </NavTooltip>
          )}

          <div className={cn("flex items-center gap-1", collapsed ? "flex-col" : "justify-between")}>
            <NavTooltip enabled={collapsed} label="Theme">
              <div className={cn("flex items-center", collapsed ? "size-10 justify-center" : "gap-2 pl-2")}>
                <ModeToggle />
              </div>
            </NavTooltip>
            <NavTooltip enabled={collapsed} label="Sign out">
              <button
                type="button"
                onClick={() => logoutMutation.mutate()}
                disabled={logoutMutation.isPending}
                aria-label="Sign out"
                className={cn(
                  "flex h-10 items-center gap-2 rounded-lg text-sm font-medium text-muted-foreground outline-none transition-[color,background-color,scale] duration-100 hover:bg-destructive/10 hover:text-destructive focus-visible:ring-2 focus-visible:ring-ring active:scale-95",
                  collapsed ? "w-10 justify-center" : "px-3",
                )}
              >
                {logoutMutation.isPending ? <Spinner className="size-4" /> : <LogOut className="size-4 shrink-0" />}
                {!collapsed && <span className="whitespace-nowrap">Sign out</span>}
              </button>
            </NavTooltip>
          </div>
        </div>
      </div>
    </LayoutGroup>
  );
}
