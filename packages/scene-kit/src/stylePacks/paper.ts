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
    tallTextScale: 1.25,
  },
  textUnits: {
    title: 13,
    heading: 11,
    chartHeading: 8.5,
    quote: 12,
    item: 7.5,
    value: 7,
    label: 5,
    subheading: 5.5,
    caption: 4.5,
    tallCaption: 5,
  },
};
