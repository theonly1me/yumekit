import {
  accentRolesOf,
  bundledFont,
  sharedLayout,
  sharedMotion,
  sharedTextUnits,
} from "./sharedParts.js";
import type { StylePack } from "./stylePack.js";

const black = "#050505";
const white = "#f5f5f5";
const accents = ["#c6ff3d", "#29e0ff", "#ff3df2", "#ff8a1f"] as const;

export const neonStylePack: StylePack = {
  id: "neon",
  name: "neon",
  label: "Neon",
  backdrop: "grid",
  cornerUnits: 0,
  colors: {
    background: black,
    surface: "#151515",
    accents,
    glow: ["#2c4a00", "#00414f"],
    text: white,
    mutedText: "rgb(245 245 245 / 0.7)",
    ...accentRolesOf(accents),
    placeholder: "#151515",
    captionPanel: "rgb(21 21 21 / 0.92)",
    captionText: white,
  },
  fonts: {
    display: bundledFont({
      family: "Space Grotesk",
      weight: 700,
      file: new URL(
        "../../fonts/SpaceGrotesk-Bold-latin.woff2",
        import.meta.url,
      ),
    }),
    body: bundledFont({
      family: "Space Grotesk",
      weight: 500,
      file: new URL(
        "../../fonts/SpaceGrotesk-Medium-latin.woff2",
        import.meta.url,
      ),
    }),
  },
  motion: sharedMotion,
  layout: sharedLayout,
  textUnits: sharedTextUnits,
};
