import {
  accentRolesOf,
  bundledFont,
  sharedLayout,
  sharedMotion,
  sharedTextUnits,
} from "./sharedParts.js";
import type { StylePack } from "./stylePack.js";

const white = "#ffffff";
const black = "#0a0a0a";
const accents = ["#2f5bff", "#ff3b30", "#00b37a", "#ffc400"] as const;

export const studioStylePack: StylePack = {
  id: "studio",
  name: "studio",
  label: "Studio",
  backdrop: "flat",
  cornerUnits: 0.6,
  colors: {
    background: white,
    surface: "#f1f2f4",
    accents,
    glow: ["#dfe6ff", "#ffe3e1"],
    text: black,
    mutedText: "rgb(10 10 10 / 0.68)",
    ...accentRolesOf(accents),
    placeholder: "#f1f2f4",
    captionPanel: "rgb(10 10 10 / 0.9)",
    captionText: white,
  },
  fonts: {
    display: bundledFont({
      family: "Inter Tight",
      weight: 800,
      file: new URL(
        "../../fonts/InterTight-ExtraBold-latin.woff2",
        import.meta.url,
      ),
    }),
    body: bundledFont({
      family: "Inter",
      weight: 500,
      file: new URL("../../fonts/Inter-Medium-latin.woff2", import.meta.url),
    }),
  },
  motion: sharedMotion,
  layout: sharedLayout,
  textUnits: sharedTextUnits,
};
