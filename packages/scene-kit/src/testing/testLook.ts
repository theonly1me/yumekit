import { paper } from "../index.js";
import type { StylePack } from "../stylePacks/stylePack.js";

export const testLook: StylePack = {
  ...paper,
  name: "test-look",
  colors: {
    ...paper.colors,
    background: "#0b0d1a",
    text: "#f4f2ff",
    glow: ["#ff6b9d", "#3ddbc4"],
  },
};
