import type { CSSProperties } from "react";
import type { StylePack } from "../stylePacks/stylePack.js";
import type { Sizes } from "./sizes.js";

const glyphOverhangUnits = 2;

export function contentBottomUnits(stylePack: StylePack): number {
  return (
    stylePack.layout.captionAreaUnits +
    stylePack.motion.riseDistanceUnits +
    glyphOverhangUnits
  );
}

export function centeredContentBox(options: {
  stylePack: StylePack;
  sizes: Sizes;
  wideWidthUnits?: number;
}): { style: CSSProperties; leadingSpace: string } {
  const { stylePack, sizes, wideWidthUnits } = options;
  const { marginUnits, captionAreaUnits } = stylePack.layout;
  const bottomUnits = contentBottomUnits(stylePack);
  return {
    style: {
      left: sizes.pixels(marginUnits),
      top: sizes.pixels(marginUnits),
      bottom: sizes.pixels(bottomUnits),
      right: sizes.pixels(marginUnits),
      justifyContent: "center",
      ...(sizes.layout === "wide" && wideWidthUnits !== undefined
        ? { maxWidth: sizes.pixels(wideWidthUnits) }
        : {}),
    },
    leadingSpace: sizes.pixels(bottomUnits - captionAreaUnits),
  };
}
