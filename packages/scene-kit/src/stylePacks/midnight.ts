import {
  accentRolesOf,
  bundledFont,
  sharedLayout,
  sharedMotion,
  sharedTextUnits,
} from "./sharedParts.js";
import type { StylePack } from "./stylePack.js";

const night = "#0b0d1a";
const starlight = "#f4f2ff";
const accents = ["#ffb637", "#ff6b9d", "#3ddbc4", "#8f7bff"] as const;

export const midnightStylePack: StylePack = {
  id: "midnight",
  name: "midnight",
  label: "Midnight",
  backdrop: "glow",
  cornerUnits: 1.2,
  colors: {
    background: night,
    surface: "#1a1d33",
    accents,
    glow: ["#4a2fd1", "#c22f7a"],
    text: starlight,
    mutedText: "rgb(244 242 255 / 0.72)",
    ...accentRolesOf(accents),
    placeholder: "#1a1d33",
    captionPanel: "rgb(26 29 51 / 0.92)",
    captionText: starlight,
  },
  fonts: {
    display: bundledFont({
      family: "Bricolage Grotesque",
      weight: 700,
      file: new URL(
        "../../fonts/BricolageGrotesque-Bold-latin.woff2",
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
