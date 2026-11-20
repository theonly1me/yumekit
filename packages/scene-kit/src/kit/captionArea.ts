import type { StylePack } from "../stylePacks/stylePack.js";

const glyphOverhangUnits = 2;

export function contentBottomUnits(stylePack: StylePack): number {
  return (
    stylePack.layout.captionAreaUnits +
    stylePack.motion.riseDistanceUnits +
    glyphOverhangUnits
  );
}
