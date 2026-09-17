"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { RiCloseLine, RiSearchLine } from "@remixicon/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function SearchBar() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [value, setValue] = useState(() =>
    pathname === "/search" ? (searchParams.get("q") ?? "") : "",
  );
  const [prevPathname, setPrevPathname] = useState(pathname);

  // Leaving the search results page clears the bar, so it doesn't linger
  // showing a stale query once the user is back browsing their library.
  if (pathname !== prevPathname) {
    setPrevPathname(pathname);
    if (pathname !== "/search") {
      setValue("");
    }
  }

  useEffect(() => {
    const trimmed = value.trim();
    const timeout = setTimeout(() => {
      if (trimmed) {
        router.replace(`/search?q=${encodeURIComponent(trimmed)}`);
      } else if (pathname === "/search") {
        router.replace("/photos");
      }
    }, 300);

    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <div className="relative w-full max-w-md">
      <RiSearchLine className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder="Search your photos"
        aria-label="Search photos"
        // A filled field that lightens when focused (white in light mode, a
        // step up from the fill in dark), with the primary focus border.
        className="border-transparent bg-secondary pl-9 pr-9 focus-visible:bg-background dark:focus-visible:bg-[color-mix(in_oklab,var(--secondary),var(--foreground)_6%)]"
      />
      {value && (
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="absolute right-1 top-1/2 -translate-y-1/2 text-muted-foreground"
          onClick={() => setValue("")}
          aria-label="Clear search"
        >
          <RiCloseLine className="size-4" />
        </Button>
      )}
    </div>
  );
}
