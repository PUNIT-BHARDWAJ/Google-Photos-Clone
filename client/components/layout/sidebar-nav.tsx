"use client";

import { useId } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutGroup, motion } from "framer-motion";
import {
  Archive,
  FolderOpen,
  Images,
  Link2,
  LogOut,
  Settings,
  Star,
  Trash2,
} from "lucide-react";
import { useLogout } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import { StorageWidget } from "@/components/library/storage-widget";
import { ModeToggle } from "@/components/ui/mode-toggle";
import { Spinner } from "@/components/ui/spinner";
import type { User } from "@/lib/api";
import Image from "next/image";

const navItems = [
  { href: "/photos", label: "Photos", icon: Images },
  { href: "/favorites", label: "Favorites", icon: Star },
  { href: "/shared-links", label: "Shared Links", icon: Link2 },
  { href: "/albums", label: "Albums", icon: FolderOpen },
  { href: "/archive", label: "Archive", icon: Archive },
  { href: "/trash", label: "Trash", icon: Trash2 },
];

// The active highlight is one shared element that glides between links
// (layoutId) instead of each link toggling its own background.
function ActiveHighlight() {
  return (
    <motion.span
      layoutId="sidebar-active"
      aria-hidden
      className="absolute inset-0 rounded-xl bg-sidebar-accent"
      transition={{ type: "spring", bounce: 0.15, duration: 0.25 }}
    />
  );
}

function NavLink({
  href,
  label,
  icon: Icon,
  isActive,
  onNavigate,
}: {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  isActive: boolean;
  onNavigate?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onNavigate}
      aria-current={isActive ? "page" : undefined}
      className={cn(
        "group/nav relative flex items-center rounded-xl text-sm font-medium transition-colors",
        isActive
          ? "text-sidebar-accent-foreground"
          : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",
      )}
    >
      {isActive && <ActiveHighlight />}
      {/* Press feedback scales the content, not the link: scaling the link
          would also scale the highlight while it measures its next position. */}
      <span className="relative flex w-full items-center gap-3 px-3 py-2.5 transition-[scale] duration-100 group-active/nav:scale-95">
        <Icon className="size-4 shrink-0" />
        <span className="truncate">{label}</span>
      </span>
    </Link>
  );
}

type SidebarNavProps = {
  user?: User | null;
  onNavigate?: () => void;
};

export function SidebarNav({ user, onNavigate }: SidebarNavProps) {
  const pathname = usePathname();
  const logoutMutation = useLogout();
  // The desktop sidebar and the mobile sheet each render a SidebarNav; a group
  // per instance keeps their highlights from animating between each other.
  const layoutGroupId = useId();

  return (
    <LayoutGroup id={layoutGroupId}>
      <div className="flex h-full flex-col">
        <div className="border-b border-sidebar-border px-5 py-5">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-xl bg-primary/15">
              <Image src={"/logo.svg"} alt="logo" width={36} height={36} />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-sidebar-foreground">Google Photos</p>
              <p className="text-xs text-muted-foreground">Clone</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-4">
          {navItems.map((item) => (
            <NavLink
              key={item.href}
              href={item.href}
              label={item.label}
              icon={item.icon}
              isActive={pathname.startsWith(item.href)}
              onNavigate={onNavigate}
            />
          ))}
        </nav>

        <div className="mt-auto space-y-3 border-t border-sidebar-border px-3 py-4">
          <StorageWidget />

          <NavLink
            href="/settings"
            label="Settings"
            icon={Settings}
            isActive={pathname.startsWith("/settings")}
            onNavigate={onNavigate}
          />

          {user && (
            <div className="rounded-xl bg-sidebar-accent/40 px-3 py-2.5">
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Signed in as</p>
              <p className="truncate text-sm font-medium text-sidebar-foreground">{user.displayName}</p>
              <p className="truncate text-xs text-muted-foreground">{user.email}</p>
            </div>
          )}

          <div className="flex items-center justify-between rounded-xl px-2 py-1.5">
            <span className="text-sm text-muted-foreground">Theme</span>
            <ModeToggle />
          </div>

          <button
            onClick={() => logoutMutation.mutate()}
            disabled={logoutMutation.isPending}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground transition-[color,background-color,scale] duration-100 hover:bg-destructive/10 hover:text-destructive active:scale-95"
          >
            {logoutMutation.isPending ? (
              <Spinner className="size-4" />
            ) : (
              <LogOut className="size-4 shrink-0" />
            )}
            <span className="truncate">Sign out</span>
          </button>
        </div>
      </div>
    </LayoutGroup>
  );
}
