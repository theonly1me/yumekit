import {
  accentRolesOf,
  bundledFont,
  sharedLayout,
  sharedMotion,
  sharedTextUnits,
} from "./sharedParts.js";
import type { StylePack } from "./stylePack.js";

const cream = "#f1ece1";
const ink = "#1b1a17";
const accents = ["#b4442c", "#2a5d50", "#c9972b", "#3b4a7a"] as const;

export const editorialStylePack: StylePack = {
  id: "editorial",
  name: "editorial",
  label: "Editorial",
  backdrop: "grain",
  cornerUnits: 0.2,
  colors: {
    background: cream,
    surface: "#e4ddcf",
    accents,
    glow: ["#eadfc8", "#dfe2d4"],
    text: ink,
    mutedText: "rgb(27 26 23 / 0.74)",
    ...accentRolesOf(accents),
    placeholder: "#e4ddcf",
    captionPanel: "rgb(27 26 23 / 0.92)",
    captionText: cream,
  },
  fonts: {
    display: bundledFont({
      family: "Fraunces",
      weight: 600,
      fallbackFamilies: "Georgia, serif",
      file: new URL(
        "../../fonts/Fraunces-SemiBold-latin.woff2",
        import.meta.url,
      ),
    }),
    body: bundledFont({
      family: "DM Sans",
      weight: 500,
      file: new URL("../../fonts/DMSans-Medium-latin.woff2", import.meta.url),
    }),
  },
  motion: sharedMotion,
  layout: sharedLayout,
  textUnits: sharedTextUnits,
};
