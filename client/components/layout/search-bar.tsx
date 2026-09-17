"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { RiCloseLine, RiSearchLine, RiSparkling2Line } from "@remixicon/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Toggle } from "@/components/ui/toggle";
import { useAiEnabled, useTopTags } from "@/hooks/use-ai";
import { searchHref } from "@/lib/search";

export function SearchBar() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const aiEnabled = useAiEnabled();
  const [value, setValue] = useState(() =>
    pathname === "/search" ? (searchParams.get("q") ?? "") : "",
  );
  const [aiSearch, setAiSearch] = useState(() => pathname === "/search" && searchParams.get("ai") === "1");
  const [focused, setFocused] = useState(false);
  const [prevPathname, setPrevPathname] = useState(pathname);
  const { data: topTags } = useTopTags(aiEnabled);

  const urlHref = pathname === "/search" ? searchHref(searchParams.get("q") ?? "", searchParams.get("ai") === "1") : null;
  const [prevUrlHref, setPrevUrlHref] = useState(urlHref);
  // The last URL this bar navigated to itself, so its own (debounced, possibly
  // stale) updates are never mistaken for someone else's navigation.
  const [ownHref, setOwnHref] = useState(urlHref);

  // Leaving the search results page clears the bar, so it doesn't linger
  // showing a stale query once the user is back browsing their library.
  if (pathname !== prevPathname) {
    setPrevPathname(pathname);
    if (pathname !== "/search") {
      setValue("");
    }
  }

  // A search started elsewhere (clicking a tag in photo info) fills the bar in.
  if (urlHref !== prevUrlHref) {
    setPrevUrlHref(urlHref);
    if (urlHref && urlHref !== ownHref) {
      setValue(searchParams.get("q") ?? "");
      setAiSearch(searchParams.get("ai") === "1");
    }
  }

  useEffect(() => {
    const trimmed = value.trim();
    const timeout = setTimeout(() => {
      if (trimmed) {
        // The toggle's own state, not gated on AI being configured: the AI
        // status loads after mount and must not strip ai=1 from the URL.
        const href = searchHref(trimmed, aiSearch);
        setOwnHref(href);
        router.replace(href);
      } else if (pathname === "/search") {
        router.replace("/photos");
      }
    }, 300);

    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, aiSearch]);

  const suggestions = topTags?.map((item) => item.tag) ?? [];
  const showSuggestions = focused && !value && suggestions.length > 0;

  return (
    <div className="relative w-full max-w-md">
      <RiSearchLine className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        value={value}
        onChange={(event) => setValue(event.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        onKeyDown={(event) => {
          if (event.key === "Escape") event.currentTarget.blur();
        }}
        placeholder={aiEnabled ? "Search photos, places, things" : "Search your photos"}
        aria-label="Search photos"
        // A filled field that lightens when focused (white in light mode, a
        // step up from the fill in dark), with the primary focus border.
        className={
          "border-transparent bg-secondary pl-9 focus-visible:bg-background dark:focus-visible:bg-[color-mix(in_oklab,var(--secondary),var(--foreground)_6%)] " +
          (aiEnabled ? "pr-20 sm:pr-36" : "pr-9")
        }
      />
      <div className="absolute right-1 top-1/2 flex -translate-y-1/2 items-center gap-0.5">
        {value && (
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="text-muted-foreground"
            onClick={() => setValue("")}
            aria-label="Clear search"
          >
            <RiCloseLine className="size-4" />
          </Button>
        )}
        {aiEnabled && (
          <Toggle
            size="sm"
            pressed={aiSearch}
            onPressedChange={setAiSearch}
            aria-label="AI Search"
            title={aiSearch ? "AI Search is on: descriptive searches are ranked by Gemini" : "Turn on AI Search"}
            className="h-7 min-w-7 gap-1 px-2 text-xs text-muted-foreground aria-pressed:bg-primary/10 aria-pressed:text-primary dark:aria-pressed:bg-primary/15"
          >
            <RiSparkling2Line />
            <span className="hidden sm:inline">AI Search</span>
          </Toggle>
        )}
      </div>

      {showSuggestions && (
        <div className="absolute inset-x-0 top-full z-50 mt-2 rounded-2xl border border-border bg-popover p-3 text-popover-foreground shadow-lg animate-in fade-in-0 slide-in-from-top-1 dark:shadow-none">
          <p className="mb-2 text-xs font-medium text-muted-foreground">Try</p>
          <div className="flex flex-wrap gap-1.5">
            {suggestions.map((tag) => (
              <button
                key={tag}
                type="button"
                // Keep focus in the input so the panel doesn't close before the click lands.
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => setValue(tag)}
                className="rounded-full border border-border px-3 py-1 text-sm text-foreground transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
