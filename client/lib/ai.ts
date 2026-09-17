// Gemini names colors in plain words ("sky blue", "off white"). Most become a
// CSS named color once the spaces are dropped; these are the common ones that
// don't - plus the basic names, whose CSS values (blue is #0000ff) are far more
// saturated than any color a photo is actually "mostly".
const COLOR_ALIASES: Record<string, string> = {
  red: "#dc4a3f",
  orange: "#f08a3c",
  yellow: "#f2c94c",
  green: "#4f9d5d",
  blue: "#4a7fd4",
  purple: "#8e5cc7",
  violet: "#8e5cc7",
  pink: "#e98ab0",
  brown: "#8a5a3b",
  gray: "#9a9a9a",
  grey: "#9a9a9a",
  black: "#1a1a1a",
  white: "#f7f7f5",
  gold: "#d4a93c",
  navy: "#243b6b",
  teal: "#2f9a95",
  turquoise: "#3cc6c0",
  "off white": "#f5f5f0",
  offwhite: "#f5f5f0",
  cream: "#fffdd0",
  golden: "gold",
  "navy blue": "navy",
  charcoal: "#36454f",
  burgundy: "#800020",
  mustard: "#e1ad01",
  peach: "#ffcba4",
  rust: "#b7410e",
  sand: "#c2b280",
  terracotta: "#e2725b",
  emerald: "#50c878",
  mint: "#98ff98",
  "mint green": "#98ff98",
  copper: "#b87333",
  bronze: "#cd7f32",
  amber: "#ffbf00",
  "sky blue": "skyblue",
  "light grey": "lightgray",
  "dark grey": "darkgray",
};

/** A CSS color for one of Gemini's color names, or null if it can't be shown. */
export function colorNameToCss(name: string): string | null {
  const normalized = name.trim().toLowerCase();
  const candidate = COLOR_ALIASES[normalized] ?? normalized.replace(/[\s-]+/g, "");
  if (typeof CSS === "undefined" || typeof CSS.supports !== "function") return null;
  return CSS.supports("color", candidate) ? candidate : null;
}

export function formatSceneType(sceneType: string) {
  return sceneType.charAt(0).toUpperCase() + sceneType.slice(1);
}

/** "~3 minutes" / "less than a minute" for the bulk analysis estimate. */
export function formatDuration(seconds: number) {
  if (seconds < 60) return "less than a minute";
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `~${minutes} minute${minutes === 1 ? "" : "s"}`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return `~${hours} hour${hours === 1 ? "" : "s"}${rest ? ` ${rest} min` : ""}`;
}
