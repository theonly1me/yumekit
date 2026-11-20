import type { CSSProperties } from "react";
import { fontFamilyOf, type StylePack } from "../stylePacks/stylePack.js";

export function displayTextStyle(stylePack: StylePack): CSSProperties {
  return {
    margin: 0,
    fontFamily: fontFamilyOf(stylePack.fonts.display),
    fontWeight: stylePack.fonts.display.weight,
    overflowWrap: "anywhere",
    textWrap: "balance",
  };
}

export function bodyTextStyle(stylePack: StylePack): CSSProperties {
  return {
    margin: 0,
    fontFamily: fontFamilyOf(stylePack.fonts.body),
    fontWeight: stylePack.fonts.body.weight,
    overflowWrap: "anywhere",
  };
}
