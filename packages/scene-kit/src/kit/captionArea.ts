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

export function centeredContentBoxStyle(options: {
  stylePack: StylePack;
  sizes: Sizes;
}): CSSProperties {
  const { stylePack, sizes } = options;
  const { marginUnits, wideContentUnits } = stylePack.layout;
  const bottomUnits = contentBottomUnits(stylePack);
  const topUnits =
    marginUnits + bottomUnits - stylePack.layout.captionAreaUnits;
  return {
    left: sizes.pixels(marginUnits),
    top: sizes.pixels(topUnits),
    bottom: sizes.pixels(bottomUnits),
    justifyContent: "center",
    ...(sizes.layout === "wide"
      ? { width: sizes.pixels(wideContentUnits) }
      : { right: sizes.pixels(marginUnits) }),
  };
}
