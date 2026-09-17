import {
  RiBasketballLine,
  RiBearSmileLine,
  RiBuilding2Line,
  RiCake2Line,
  RiCarLine,
  RiFileTextLine,
  RiHome4Line,
  RiImageLine,
  RiLandscapeLine,
  RiMoonClearLine,
  RiPaletteLine,
  RiRestaurantLine,
  RiScreenshot2Line,
  RiTreeLine,
  RiUser3Line,
  RiZoomInLine,
  type RemixiconComponentType,
} from "@remixicon/react";

/** The scene types Gemini assigns (see GeminiResponseParser.SCENE_TYPES). */
export const SCENE_ICONS: Record<string, RemixiconComponentType> = {
  outdoor: RiTreeLine,
  indoor: RiHome4Line,
  portrait: RiUser3Line,
  landscape: RiLandscapeLine,
  food: RiRestaurantLine,
  document: RiFileTextLine,
  screenshot: RiScreenshot2Line,
  art: RiPaletteLine,
  animal: RiBearSmileLine,
  vehicle: RiCarLine,
  architecture: RiBuilding2Line,
  night: RiMoonClearLine,
  macro: RiZoomInLine,
  sport: RiBasketballLine,
  event: RiCake2Line,
};

/** Collection-style names for filter chips and breadcrumbs. */
const SCENE_COLLECTION_LABELS: Record<string, string> = {
  outdoor: "Outdoor",
  indoor: "Indoor",
  portrait: "Portraits",
  landscape: "Landscapes",
  food: "Food",
  document: "Documents",
  screenshot: "Screenshots",
  art: "Art",
  animal: "Animals",
  vehicle: "Vehicles",
  architecture: "Architecture",
  night: "Night",
  macro: "Close-ups",
  sport: "Sports",
  event: "Events",
};

export function sceneIcon(scene: string): RemixiconComponentType {
  return SCENE_ICONS[scene] ?? RiImageLine;
}

export function sceneCollectionLabel(scene: string) {
  return SCENE_COLLECTION_LABELS[scene] ?? scene.charAt(0).toUpperCase() + scene.slice(1);
}
