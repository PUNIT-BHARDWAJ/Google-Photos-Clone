"use client";

import Link from "next/link";
import { useParams, usePathname, useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { RiArrowRightSLine } from "@remixicon/react";
import { useAlbum } from "@/hooks/use-albums";
import { parsePhotosFilter, photosFilterLabel } from "@/lib/photo-filters";

type Crumb = {
  /** Stable per segment, so a segment that stays put doesn't re-animate. */
  key: string;
  label: string;
  href: string;
};

const SECTION_LABELS: Record<string, string> = {
  "/favorites": "Favorites",
  "/albums": "Albums",
  "/shared-links": "Shared links",
  "/archive": "Archive",
  "/trash": "Trash",
  "/settings": "Settings",
  "/search": "Search",
};

const ROOT: Crumb = { key: "root", label: "Photos", href: "/photos" };

function useCrumbs(): Crumb[] {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const params = useParams<{ id?: string }>();
  const albumId = pathname.startsWith("/albums/") ? (params.id ?? null) : null;
  const { data: album } = useAlbum(albumId);

  if (pathname === "/photos") {
    const filter = parsePhotosFilter(searchParams.get("filter"));
    return filter.kind === "all"
      ? [ROOT]
      : [ROOT, { key: `filter:${searchParams.get("filter")}`, label: photosFilterLabel(filter), href: pathname }];
  }

  if (albumId) {
    const albums: Crumb = { key: "/albums", label: "Albums", href: "/albums" };
    return album ? [ROOT, albums, { key: `album:${albumId}`, label: album.title, href: pathname }] : [ROOT, albums];
  }

  const section = Object.keys(SECTION_LABELS).find((path) => pathname === path);
  if (!section) return [ROOT];
  const crumbs = [ROOT, { key: section, label: SECTION_LABELS[section], href: section }];

  const query = pathname === "/search" ? searchParams.get("q")?.trim() : null;
  if (query) {
    // One stable segment: refining the query updates it in place instead of
    // sliding a new crumb in on every keystroke.
    crumbs.push({ key: "q", label: `“${query}”`, href: `${pathname}?${searchParams.toString()}` });
  }
  return crumbs;
}

/**
 * Where you are, as a clickable path: Photos › Albums › Vacation. Going deeper
 * slides the new segment in from the right; going back slides it out the same
 * way. Segments that stay are left alone.
 */
export function Breadcrumbs() {
  const crumbs = useCrumbs();

  // A path of one is just the page you're already on (the unfiltered library,
  // whose heading says so) - nothing to navigate, so nothing to show.
  if (crumbs.length < 2) return null;

  return (
    <nav aria-label="Breadcrumb" className="mb-2 min-h-5">
      <ol className="flex min-w-0 flex-wrap items-center gap-x-1 gap-y-0.5 text-sm text-muted-foreground">
        <AnimatePresence initial={false} mode="popLayout">
          {crumbs.map((crumb, index) => {
            const isLast = index === crumbs.length - 1;
            return (
              <motion.li
                key={crumb.key}
                layout="position"
                className="flex min-w-0 items-center gap-1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
              >
                {index > 0 && (
                  <motion.span
                    aria-hidden
                    className="flex text-muted-foreground/70"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.2, delay: 0.05 }}
                  >
                    <RiArrowRightSLine className="size-4" />
                  </motion.span>
                )}
                {isLast ? (
                  <span aria-current="page" className="max-w-[16rem] truncate font-medium text-foreground">
                    {crumb.label}
                  </span>
                ) : (
                  <Link
                    href={crumb.href}
                    className="max-w-[12rem] truncate rounded-sm transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {crumb.label}
                  </Link>
                )}
              </motion.li>
            );
          })}
        </AnimatePresence>
      </ol>
    </nav>
  );
}
