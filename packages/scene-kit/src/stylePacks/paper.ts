import type { StylePack } from "./stylePack.js";

const ink = "#18203a";
const paper = "#eef1f4";
const lamp = "#f2b33d";
const asagi = "#4db6ae";
const sakura = "#e891ab";
const fuji = "#a294e0";

export const paperStylePack: StylePack = {
  name: "paper",
  colors: {
    background: paper,
    text: ink,
    mutedText: "rgb(24 32 58 / 0.75)",
    accent: lamp,
    bullet: asagi,
    bars: [sakura, asagi, fuji],
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
  motion: {
    referenceFramesPerSecond: 30,
    riseFrames: 14,
    riseDistanceUnits: 6,
    staggerFrames: 20,
    wordStaggerFrames: 12,
    settleShareOfClip: 0.7,
  },
  layout: {
    marginUnits: 8,
    captionAreaUnits: 16,
    barUnits: 8,
    longestBarShare: 0.8,
    stackedLongestBarShare: 0.72,
    bulletShareOfItem: 0.45,
    itemGapShareOfItem: 0.55,
    wideHeadingColumnUnits: 62,
    wideContentColumnStartUnits: 78,
    wideQuoteUnits: 130,
    wideTitleUnits: 120,
  },
  textUnits: {
    wide: {
      title: 15,
      quote: 13,
      heading: 12,
      item: 8,
      value: 7.5,
      label: 5.5,
      caption: 5,
    },
    square: {
      title: 13,
      quote: 12,
      heading: 11,
      item: 7.5,
      value: 7,
      label: 5,
      caption: 5,
    },
    tall: {
      title: 14,
      quote: 12.5,
      heading: 12,
      item: 8,
      value: 7.5,
      label: 5.5,
      caption: 5.5,
    },
  },
};
