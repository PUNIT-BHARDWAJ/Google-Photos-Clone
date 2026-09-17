"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion, type Transition } from "framer-motion";
import {
  RiCloseLine,
  RiHistoryLine,
  RiPriceTag3Line,
  RiSearchLine,
  RiSparkling2Line,
  type RemixiconComponentType,
} from "@remixicon/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Toggle } from "@/components/ui/toggle";
import { FOCUS_SEARCH_EVENT } from "@/components/layout/mobile-bottom-nav";
import { useAiEnabled, useTopTags } from "@/hooks/use-ai";
import { usePhotoFacets } from "@/hooks/use-photos";
import { useStoredState } from "@/hooks/use-stored-state";
import { sceneCollectionLabel, sceneIcon } from "@/lib/scenes";
import { addRecentSearch, parseRecentSearches, searchHref } from "@/lib/search";
import { cn } from "@/lib/utils";

const SEARCH_SPRING: Transition = { type: "spring", stiffness: 400, damping: 30 };
const RECENT_KEY = "gp-recent-searches";
const NO_RECENT: string[] = [];
const COLLAPSED_WIDTH = 448;
const EXPANDED_WIDTH = 488;

type Option = {
  id: string;
  section: "recent" | "suggestions";
  value: string;
  label: string;
  icon: RemixiconComponentType;
  count?: number;
};

/** The advanced filters on the current results page, kept when the query changes. */
function currentFilterParams() {
  if (window.location.pathname !== "/search") return undefined;
  const params = new URLSearchParams(window.location.search);
  params.delete("q");
  params.delete("ai");
  return params;
}

function currentHref() {
  return `${window.location.pathname}${window.location.search}`;
}

/** The label with the typed text in bold, where it matches. */
function Highlighted({ text, match }: { text: string; match: string }) {
  const index = match ? text.toLowerCase().indexOf(match.toLowerCase()) : -1;
  if (index === -1) return <>{text}</>;
  return (
    <>
      {text.slice(0, index)}
      <span className="font-semibold text-foreground">{text.slice(index, index + match.length)}</span>
      {text.slice(index + match.length)}
    </>
  );
}

export function SearchBar() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const aiEnabled = useAiEnabled();
  const inputRef = useRef<HTMLInputElement>(null);
  const listboxId = useId();
  const [value, setValue] = useState(() => (pathname === "/search" ? (searchParams.get("q") ?? "") : ""));
  const [aiSearch, setAiSearch] = useState(() => pathname === "/search" && searchParams.get("ai") === "1");
  const [focused, setFocused] = useState(false);
  // Escape or picking an option closes the list until the user types again.
  const [dismissed, setDismissed] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [prevPathname, setPrevPathname] = useState(pathname);
  const [recent, setRecent] = useStoredState(RECENT_KEY, NO_RECENT, parseRecentSearches);
  const { data: topTags } = useTopTags(aiEnabled);
  const { data: facets } = usePhotoFacets();

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

  function navigate(query: string, ai: boolean) {
    const filters = currentFilterParams();
    if (query) {
      setOwnHref(searchHref(query, ai));
      const href = searchHref(query, ai, filters);
      if (href !== currentHref()) router.replace(href);
    } else if (window.location.pathname === "/search") {
      // Clearing the field stays on the search page (with any filters still
      // applied) rather than bouncing back to the library.
      setOwnHref(searchHref("", ai));
      const href = searchHref("", ai, filters);
      if (href !== currentHref()) router.replace(href);
    }
  }

  useEffect(() => {
    const timeout = setTimeout(() => navigate(value.trim(), aiSearch), 300);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, aiSearch]);

  // The phone bottom bar's Search tab puts the cursor here.
  useEffect(() => {
    function focus() {
      inputRef.current?.focus();
    }
    window.addEventListener(FOCUS_SEARCH_EVENT, focus);
    return () => window.removeEventListener(FOCUS_SEARCH_EVENT, focus);
  }, []);

  const trimmed = value.trim();
  const options = useMemo<Option[]>(() => {
    const needle = trimmed.toLowerCase();
    if (!needle) {
      const recentOptions = recent.slice(0, 6).map<Option>((item, index) => ({
        id: `recent-${index}`,
        section: "recent",
        value: item,
        label: item,
        icon: RiHistoryLine,
      }));
      const tagOptions = (topTags ?? [])
        .filter(({ tag }) => !recent.some((item) => item.toLowerCase() === tag.toLowerCase()))
        .slice(0, 6)
        .map<Option>(({ tag, count }) => ({
          id: `tag-${tag}`,
          section: "suggestions",
          value: tag,
          label: tag,
          icon: RiPriceTag3Line,
          count,
        }));
      return [...recentOptions, ...tagOptions];
    }

    const recentOptions = recent
      .filter((item) => item.toLowerCase().includes(needle) && item.toLowerCase() !== needle)
      .slice(0, 3)
      .map<Option>((item, index) => ({
        id: `recent-${index}`,
        section: "recent",
        value: item,
        label: item,
        icon: RiHistoryLine,
      }));
    const taken = new Set([needle, ...recentOptions.map((option) => option.value.toLowerCase())]);
    // Word-start matches: "sun" finds "sunset" and "rising sun", not "tsunami".
    const wordStart = (text: string) => text.split(/\s+/).some((word) => word.startsWith(needle)) || text.startsWith(needle);
    const sceneOptions = (facets?.scenes ?? [])
      .filter((scene) => wordStart(scene.value) && !taken.has(scene.value))
      .slice(0, 2)
      .map<Option>((scene) => ({
        id: `scene-${scene.value}`,
        section: "suggestions",
        value: scene.value,
        label: sceneCollectionLabel(scene.value),
        icon: sceneIcon(scene.value),
        count: scene.count,
      }));
    sceneOptions.forEach((option) => taken.add(option.value));
    const tagOptions = (facets?.tags ?? [])
      .filter((tag) => wordStart(tag.value) && !taken.has(tag.value))
      // Real subjects before style words, then the tags with the most photos.
      .sort((a, b) => Number(a.generic) - Number(b.generic) || Number(b.value.startsWith(needle)) - Number(a.value.startsWith(needle)) || b.count - a.count)
      .slice(0, 6 - sceneOptions.length)
      .map<Option>((tag) => ({
        id: `tag-${tag.value}`,
        section: "suggestions",
        value: tag.value,
        label: tag.value,
        icon: RiPriceTag3Line,
        count: tag.count,
      }));
    return [...recentOptions, ...sceneOptions, ...tagOptions];
  }, [trimmed, recent, topTags, facets]);

  const open = focused && !dismissed && options.length > 0;
  const expanded = focused || value.length > 0;
  const optionDomId = (option: Option) => `${listboxId}-${option.id.replace(/[^a-zA-Z0-9_-]/g, "_")}`;

  function remember(query: string) {
    if (query.trim()) setRecent((current) => addRecentSearch(current, query));
  }

  function commit(query: string) {
    const next = query.trim();
    setValue(next);
    setDismissed(true);
    setActiveIndex(-1);
    remember(next);
    // Straight away - no need to wait out the typing debounce.
    navigate(next, aiSearch);
  }

  function handleChange(next: string) {
    setValue(next);
    setDismissed(false);
    setActiveIndex(-1);
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    switch (event.key) {
      case "ArrowDown":
      case "ArrowUp": {
        if (options.length === 0) return;
        event.preventDefault();
        if (!open) {
          setDismissed(false);
          setActiveIndex(event.key === "ArrowDown" ? 0 : options.length - 1);
          return;
        }
        const step = event.key === "ArrowDown" ? 1 : -1;
        setActiveIndex((index) => {
          if (index === -1) return step === 1 ? 0 : options.length - 1;
          return (index + step + options.length) % options.length;
        });
        return;
      }
      case "Enter": {
        const option = open && activeIndex >= 0 ? options[activeIndex] : undefined;
        if (option || trimmed) {
          event.preventDefault();
          commit(option ? option.value : value);
        }
        return;
      }
      case "Delete": {
        // Shift+Delete forgets the highlighted recent search, as in browsers.
        const option = open && activeIndex >= 0 ? options[activeIndex] : undefined;
        if (event.shiftKey && option?.section === "recent") {
          event.preventDefault();
          setRecent((current) => current.filter((item) => item !== option.value));
          setActiveIndex(-1);
        }
        return;
      }
      case "Escape":
        if (open) {
          event.preventDefault();
          setDismissed(true);
          setActiveIndex(-1);
        } else {
          event.currentTarget.blur();
        }
        return;
    }
  }

  const recentOptions = options.filter((option) => option.section === "recent");
  const suggestionOptions = options.filter((option) => option.section === "suggestions");

  function renderOption(option: Option) {
    const index = options.indexOf(option);
    const active = index === activeIndex;
    const Icon = option.icon;
    return (
      <li
        key={option.id}
        id={optionDomId(option)}
        role="option"
        aria-selected={active}
        // Keep focus in the input so the list doesn't close before the click lands.
        onMouseDown={(event) => event.preventDefault()}
        onMouseMove={() => activeIndex !== index && setActiveIndex(index)}
        onClick={() => commit(option.value)}
        className={cn(
          "flex h-9 cursor-pointer items-center gap-3 rounded-xl px-3 text-sm text-muted-foreground transition-colors",
          active && "bg-accent text-accent-foreground",
        )}
      >
        <Icon className={cn("size-4 shrink-0", active ? "text-primary" : "text-muted-foreground")} />
        <span className="min-w-0 flex-1 truncate text-foreground/90">
          <Highlighted text={option.label} match={trimmed} />
        </span>
        {option.count !== undefined && (
          <span className="shrink-0 text-xs text-muted-foreground tabular-nums">{option.count}</span>
        )}
      </li>
    );
  }

  return (
    <motion.div
      className="relative w-full"
      initial={false}
      animate={{ maxWidth: expanded ? EXPANDED_WIDTH : COLLAPSED_WIDTH }}
      transition={SEARCH_SPRING}
    >
      <motion.span
        aria-hidden
        className={cn(
          "pointer-events-none absolute top-1/2 left-3 flex -translate-y-1/2 transition-colors duration-200",
          focused ? "text-primary" : "text-muted-foreground",
        )}
        initial={false}
        animate={{ x: focused ? 2 : 0 }}
        transition={SEARCH_SPRING}
      >
        <RiSearchLine className="size-4" />
      </motion.span>
      <Input
        ref={inputRef}
        value={value}
        onChange={(event) => handleChange(event.target.value)}
        onFocus={() => {
          setFocused(true);
          setDismissed(false);
        }}
        onBlur={() => {
          setFocused(false);
          setActiveIndex(-1);
          if (pathname === "/search" && trimmed.length >= 2) remember(trimmed);
        }}
        onKeyDown={handleKeyDown}
        placeholder={aiEnabled ? "Search photos, places, things" : "Search your photos"}
        aria-label="Search photos"
        role="combobox"
        aria-expanded={open}
        aria-controls={listboxId}
        aria-autocomplete="list"
        aria-activedescendant={open && activeIndex >= 0 ? optionDomId(options[activeIndex]) : undefined}
        autoComplete="off"
        enterKeyHint="search"
        // A filled field that lightens when focused (white in light mode, a
        // step up from the fill in dark), with the primary focus border.
        className={cn(
          "border-transparent bg-secondary pl-9 focus-visible:border-primary focus-visible:bg-background dark:focus-visible:bg-[color-mix(in_oklab,var(--secondary),var(--foreground)_6%)]",
          aiEnabled ? "pr-20 sm:pr-36" : "pr-9",
        )}
      />
      <div className="absolute top-1/2 right-1 flex -translate-y-1/2 items-center gap-0.5">
        {value && (
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="text-muted-foreground"
            // The field keeps focus: a blur would file the half-typed text as a recent search.
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => {
              handleChange("");
              inputRef.current?.focus();
            }}
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
            onMouseDown={(event) => event.preventDefault()}
            aria-label="AI Search"
            title={aiSearch ? "AI Search is on: descriptive searches are ranked by Gemini" : "Turn on AI Search"}
            className="h-7 min-w-7 gap-1 px-2 text-xs text-muted-foreground aria-pressed:bg-primary/10 aria-pressed:text-primary dark:aria-pressed:bg-primary/15"
          >
            <RiSparkling2Line />
            <span className="hidden sm:inline">AI Search</span>
          </Toggle>
        )}
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            key="autocomplete"
            className="glass-panel absolute inset-x-0 top-full z-50 mt-2 origin-top rounded-2xl border border-border p-1.5 text-popover-foreground"
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98, transition: { duration: 0.1 } }}
            transition={SEARCH_SPRING}
          >
            <ul id={listboxId} role="listbox" aria-label="Search suggestions" className="space-y-0.5">
              {recentOptions.length > 0 && (
                <li role="presentation">
                  <div className="flex h-7 items-center justify-between px-3">
                    <span className="text-xs font-medium text-muted-foreground">Recent searches</span>
                    {!trimmed && (
                      <button
                        type="button"
                        tabIndex={-1}
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={() => {
                          setRecent([]);
                          setActiveIndex(-1);
                        }}
                        className="text-xs text-muted-foreground transition-colors hover:text-foreground"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                  <ul role="group" aria-label="Recent searches" className="space-y-0.5">
                    {recentOptions.map(renderOption)}
                  </ul>
                </li>
              )}
              {recentOptions.length > 0 && suggestionOptions.length > 0 && (
                <li role="presentation" aria-hidden className="divider-fade mx-3 my-1.5" />
              )}
              {suggestionOptions.length > 0 && (
                <li role="presentation">
                  <div className="flex h-7 items-center px-3">
                    <span className="text-xs font-medium text-muted-foreground">{trimmed ? "Suggestions" : "Try"}</span>
                  </div>
                  <ul role="group" aria-label={trimmed ? "Suggestions" : "Try"} className="space-y-0.5">
                    {suggestionOptions.map(renderOption)}
                  </ul>
                </li>
              )}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
