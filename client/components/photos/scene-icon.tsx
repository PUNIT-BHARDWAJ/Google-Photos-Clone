import { RiImageLine } from "@remixicon/react";
import { SCENE_ICONS } from "@/lib/scenes";

/** The icon for one of Gemini's scene types; a plain image icon for anything unknown. */
export function SceneIcon({ scene, className }: { scene: string; className?: string }) {
  const Icon = SCENE_ICONS[scene] ?? RiImageLine;
  return <Icon className={className} />;
}
