import {
  accentRolesOf,
  sharedLayout,
  sharedMotion,
  sharedTextUnits,
} from "./sharedParts.js";
import type { StylePack } from "./stylePack.js";

const ink = "#18203a";
const paper = "#eef1f4";
const accents = ["#f2b33d", "#e891ab", "#4db6ae", "#a294e0"] as const;

export const paperStylePack: StylePack = {
  id: "paper",
  name: "paper",
  label: "Paper",
  backdrop: "flat",
  cornerUnits: 1.2,
  colors: {
    background: paper,
    surface: "#dfe4ea",
    accents,
    glow: ["#f7e2b8", "#f4d3de"],
    text: ink,
    mutedText: "rgb(24 32 58 / 0.75)",
    ...accentRolesOf(accents),
    placeholder: "#dfe4ea",
    captionPanel: "rgb(24 32 58 / 0.92)",
    captionText: paper,
  },
  fonts: {
    display: {
      family: "Zen Maru Gothic",
      weight: 700,
      fallbackFamilies: '"Hiragino Maru Gothic ProN", sans-serif',
      file: new URL(
        "../../fonts/ZenMaruGothic-Bold-latin.woff2",
        import.meta.url,
      ),
    },
    body: {
      family: "Zen Kaku Gothic New",
      weight: 500,
      fallbackFamilies: '"Hiragino Sans", sans-serif',
      file: new URL(
        "../../fonts/ZenKakuGothicNew-Medium-latin.woff2",
        import.meta.url,
      ),
    },
  },
  motion: sharedMotion,
  layout: sharedLayout,
  textUnits: sharedTextUnits,
};
