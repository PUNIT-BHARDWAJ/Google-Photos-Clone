"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion, type Transition, type Variants } from "framer-motion";
import { RiCalendarLine, RiCheckLine, RiCloseLine, RiPriceTag3Line, RiSearchLine } from "@remixicon/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SceneIcon } from "@/components/photos/scene-icon";
import type { PhotoFacets } from "@/lib/api";
import { colorNameToCss } from "@/lib/ai";
import { sceneCollectionLabel } from "@/lib/scenes";
import {
  countSearchFilters,
  datePresets,
  formatDateInput,
  formatDateRange,
  type SearchFilterState,
} from "@/lib/search-filters";
import { cn } from "@/lib/utils";

const PANEL_SPRING: Transition = { type: "spring", stiffness: 400, damping: 35 };
const POP_SPRING: Transition = { type: "spring", stiffness: 500, damping: 25 };
const VISIBLE_TAGS = 24;

// Opening: the panel grows, its content fades in 100ms later, group by group.
// Closing: the content fades out first, then the panel folds away.
const panelVariants: Variants = {
  open: {
    height: "auto",
    opacity: 1,
    transition: { height: PANEL_SPRING, opacity: { duration: 0.15 }, delayChildren: 0.1, staggerChildren: 0.03 },
  },
  closed: {
    height: 0,
    opacity: 0,
    transition: {
      height: PANEL_SPRING,
      opacity: { duration: 0.15 },
      when: "afterChildren",
      staggerChildren: 0.02,
      staggerDirection: -1,
    },
  },
};

const groupVariants: Variants = {
  open: { opacity: 1, y: 0, transition: { duration: 0.2, ease: "easeOut" } },
  closed: { opacity: 0, y: -4, transition: { duration: 0.1 } },
};

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

type ToggleChipProps = {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  className?: string;
};

function ToggleChip({ active, onClick, children, className }: ToggleChipProps) {
  return (
    <motion.button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      whileTap={{ scale: 0.96 }}
      transition={POP_SPRING}
      className={cn(
        "flex h-8 shrink-0 items-center gap-1.5 rounded-full border px-3 text-sm font-medium whitespace-nowrap outline-none transition-[color,background-color,border-color,opacity] duration-200 focus-visible:ring-2 focus-visible:ring-ring",
        active
          ? "border-primary/30 bg-primary/10 text-primary dark:bg-primary/15"
          : "border-border text-foreground opacity-70 hover:opacity-100",
        className,
      )}
    >
      {children}
    </motion.button>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <motion.fieldset variants={groupVariants} className="min-w-0 space-y-2.5">
      <legend className="mb-2.5 text-xs font-semibold tracking-wide text-muted-foreground uppercase">{title}</legend>
      {children}
    </motion.fieldset>
  );
}

type AdvancedSearchPanelProps = {
  id: string;
  open: boolean;
  filters: SearchFilterState;
  onChange: (next: SearchFilterState) => void;
  onClose: () => void;
  facets?: PhotoFacets;
};

/** Date, scene, color and tag filters that fold open under the search toolbar. */
export function AdvancedSearchPanel({ id, open, filters, onChange, onClose, facets }: AdvancedSearchPanelProps) {
  const [tagQuery, setTagQuery] = useState("");
  const presets = useMemo(() => datePresets(), []);
  const today = formatDateInput(new Date());
  const activeCount = countSearchFilters(filters);

  const scenes = facets?.scenes ?? [];
  const colors = (facets?.colors ?? []).filter((color) => colorNameToCss(color.value));
  const tags = useMemo(() => {
    const all = (facets?.tags ?? []).filter((tag) => !tag.generic);
    const needle = tagQuery.trim().toLowerCase();
    const matching = needle ? all.filter((tag) => tag.value.includes(needle)) : all;
    const visible = matching.slice(0, VISIBLE_TAGS);
    // Selected tags stay reachable even when they fall outside the top list.
    const missing = filters.tags
      .filter((tag) => !visible.some((item) => item.value === tag))
      .map((tag) => all.find((item) => item.value === tag) ?? { value: tag, count: 0, generic: false });
    return [...missing, ...visible];
  }, [facets, tagQuery, filters.tags]);

  function toggleTag(tag: string) {
    const next = filters.tags.includes(tag) ? filters.tags.filter((item) => item !== tag) : [...filters.tags, tag];
    onChange({ ...filters, tags: next });
  }

  return (
    <AnimatePresence initial={false}>
      {open && (
        <motion.section
          key="advanced-search"
          id={id}
          aria-label="Search filters"
          className="-mx-1 overflow-hidden px-1"
          initial="closed"
          animate="open"
          exit="closed"
          variants={panelVariants}
        >
          <div className="glass-panel mb-4 grid gap-6 rounded-2xl border border-border p-4 sm:p-5 lg:grid-cols-2">
            <Group title="Date">
              <div className="flex flex-wrap gap-1.5">
                {presets.map((preset) => {
                  const active = filters.from === preset.from && filters.to === preset.to;
                  return (
                    <ToggleChip
                      key={preset.key}
                      active={active}
                      onClick={() =>
                        onChange(
                          active
                            ? { ...filters, from: undefined, to: undefined }
                            : { ...filters, from: preset.from, to: preset.to },
                        )
                      }
                    >
                      {preset.label}
                    </ToggleChip>
                  );
                })}
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                <label className="flex min-w-0 flex-col gap-1 text-xs text-muted-foreground">
                  From
                  <Input
                    type="date"
                    value={filters.from ?? ""}
                    max={filters.to ?? today}
                    onChange={(event) => onChange({ ...filters, from: event.target.value || undefined })}
                  />
                </label>
                <label className="flex min-w-0 flex-col gap-1 text-xs text-muted-foreground">
                  To
                  <Input
                    type="date"
                    value={filters.to ?? ""}
                    min={filters.from}
                    max={today}
                    onChange={(event) => onChange({ ...filters, to: event.target.value || undefined })}
                  />
                </label>
              </div>
            </Group>

            <Group title="Scene">
              {scenes.length === 0 ? (
                <p className="text-sm text-muted-foreground">Scenes appear once AI has analyzed your photos.</p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {scenes.map((scene) => {
                    const active = filters.scene === scene.value;
                    return (
                      <ToggleChip
                        key={scene.value}
                        active={active}
                        onClick={() => onChange({ ...filters, scene: active ? undefined : scene.value })}
                      >
                        <SceneIcon scene={scene.value} className="size-4" />
                        {sceneCollectionLabel(scene.value)}
                        <span className={cn("text-xs tabular-nums", active ? "text-primary/80" : "text-muted-foreground")}>
                          {scene.count}
                        </span>
                      </ToggleChip>
                    );
                  })}
                </div>
              )}
            </Group>

            <Group title="Color">
              {colors.length === 0 ? (
                <p className="text-sm text-muted-foreground">Colors appear once AI has analyzed your photos.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {colors.map((color) => {
                    const active = filters.color === color.value;
                    const label = `${capitalize(color.value)} (${color.count})`;
                    return (
                      <motion.button
                        key={color.value}
                        type="button"
                        aria-pressed={active}
                        aria-label={label}
                        title={label}
                        onClick={() => onChange({ ...filters, color: active ? undefined : color.value })}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.92 }}
                        transition={POP_SPRING}
                        className={cn(
                          "flex size-8 items-center justify-center rounded-full border border-black/10 shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background dark:border-white/15",
                          active && "ring-2 ring-primary ring-offset-2 ring-offset-background",
                        )}
                        style={{ backgroundColor: colorNameToCss(color.value) ?? undefined }}
                      >
                        <AnimatePresence>
                          {active && (
                            <motion.span
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              exit={{ scale: 0 }}
                              transition={POP_SPRING}
                              className="flex rounded-full bg-black/35 p-0.5 text-white"
                            >
                              <RiCheckLine className="size-3.5" />
                            </motion.span>
                          )}
                        </AnimatePresence>
                      </motion.button>
                    );
                  })}
                </div>
              )}
            </Group>

            <Group title="Tags">
              {(facets?.tags ?? []).length === 0 ? (
                <p className="text-sm text-muted-foreground">Tags appear once AI has analyzed your photos.</p>
              ) : (
                <>
                  <div className="relative">
                    <RiSearchLine className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      value={tagQuery}
                      onChange={(event) => setTagQuery(event.target.value)}
                      placeholder="Find a tag"
                      aria-label="Find a tag"
                      className="pl-9"
                    />
                  </div>
                  <div className="scrollbar-hover flex max-h-36 flex-wrap gap-1.5 overflow-y-auto">
                    {tags.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No tags match &ldquo;{tagQuery.trim()}&rdquo;</p>
                    ) : (
                      tags.map((tag) => (
                        <ToggleChip
                          key={tag.value}
                          active={filters.tags.includes(tag.value)}
                          onClick={() => toggleTag(tag.value)}
                        >
                          <RiPriceTag3Line className="size-3.5" />
                          {tag.value}
                          {tag.count > 0 && (
                            <span className="text-xs text-muted-foreground tabular-nums">{tag.count}</span>
                          )}
                        </ToggleChip>
                      ))
                    )}
                  </div>
                </>
              )}
            </Group>

            <motion.div
              variants={groupVariants}
              className="divider-fade -mx-4 sm:-mx-5 lg:col-span-2"
              aria-hidden
            />
            <motion.div variants={groupVariants} className="-mt-3 flex items-center justify-between gap-2 lg:col-span-2">
              <Button
                variant="ghost"
                size="sm"
                disabled={activeCount === 0}
                onClick={() => onChange({ tags: [] })}
              >
                Clear all
              </Button>
              <Button size="sm" onClick={onClose}>
                Done
              </Button>
            </motion.div>
          </div>
        </motion.section>
      )}
    </AnimatePresence>
  );
}

type ActiveFilterChipsProps = {
  filters: SearchFilterState;
  onChange: (next: SearchFilterState) => void;
};

/** One removable chip per active filter; each pops in as it's added and out as it's removed. */
export function ActiveFilterChips({ filters, onChange }: ActiveFilterChipsProps) {
  const chips: { key: string; label: string; swatch?: string | null; icon?: React.ReactNode; remove: () => void }[] =
    [];
  if (filters.from || filters.to) {
    chips.push({
      key: "date",
      label: formatDateRange(filters.from, filters.to),
      icon: <RiCalendarLine className="size-3.5" />,
      remove: () => onChange({ ...filters, from: undefined, to: undefined }),
    });
  }
  if (filters.scene) {
    chips.push({
      key: "scene",
      label: sceneCollectionLabel(filters.scene),
      icon: <SceneIcon scene={filters.scene} className="size-3.5" />,
      remove: () => onChange({ ...filters, scene: undefined }),
    });
  }
  if (filters.color) {
    chips.push({
      key: "color",
      label: capitalize(filters.color),
      swatch: colorNameToCss(filters.color),
      remove: () => onChange({ ...filters, color: undefined }),
    });
  }
  filters.tags.forEach((tag) =>
    chips.push({
      key: `tag:${tag}`,
      label: tag,
      icon: <RiPriceTag3Line className="size-3.5" />,
      remove: () => onChange({ ...filters, tags: filters.tags.filter((item) => item !== tag) }),
    }),
  );

  return (
    <AnimatePresence initial={false} mode="popLayout">
      {chips.map((chip) => (
        <motion.button
          key={chip.key}
          type="button"
          layout="position"
          onClick={chip.remove}
          aria-label={`Remove filter: ${chip.label}`}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          transition={POP_SPRING}
          className="group/chip flex h-7 shrink-0 items-center gap-1.5 rounded-full bg-primary/10 pr-1.5 pl-2.5 text-xs font-medium whitespace-nowrap text-primary outline-none hover:bg-primary/15 focus-visible:ring-2 focus-visible:ring-ring dark:bg-primary/15"
        >
          {chip.swatch ? (
            <span
              className="size-3 rounded-full border border-black/10 dark:border-white/20"
              style={{ backgroundColor: chip.swatch }}
            />
          ) : (
            chip.icon
          )}
          <span className="max-w-40 truncate">{chip.label}</span>
          <RiCloseLine className="size-3.5 opacity-60 group-hover/chip:opacity-100" />
        </motion.button>
      ))}
    </AnimatePresence>
  );
}
