import type { StyleFont, StylePack } from "./stylePack.js";

export const sharedMotion: StylePack["motion"] = {
  referenceFramesPerSecond: 30,
  riseFrames: 18,
  riseDistanceUnits: 6,
  staggerFrames: 8,
  wordStaggerFrames: 3,
  settleShareOfClip: 0.7,
};

export const sharedLayout: StylePack["layout"] = {
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
};

export const sharedTextUnits: StylePack["textUnits"] = {
  wide: {
    title: 15,
    quote: 13,
    heading: 12,
    item: 8,
    value: 7.5,
    label: 5.5,
    caption: 5,
    number: 46,
    statement: 24,
    filmHeading: 9.6,
    filmLine: 14,
    filmLabel: 2.8,
    filmNumber: 11,
    filmWordmark: 20,
    filmCommand: 3.8,
    filmItem: 4.6,
  },
  square: {
    title: 13,
    quote: 12,
    heading: 11,
    item: 7.5,
    value: 7,
    label: 5,
    caption: 5,
    number: 30,
    statement: 19,
    filmHeading: 8.4,
    filmLine: 12,
    filmLabel: 3.2,
    filmNumber: 10,
    filmWordmark: 17,
    filmCommand: 4,
    filmItem: 4.4,
  },
  tall: {
    title: 14,
    quote: 12.5,
    heading: 12,
    item: 8,
    value: 7.5,
    label: 5.5,
    caption: 5.5,
    number: 42,
    statement: 20,
    filmHeading: 8.8,
    filmLine: 12,
    filmLabel: 3.4,
    filmNumber: 11,
    filmWordmark: 17,
    filmCommand: 4.2,
    filmItem: 4.6,
  },
};

export function accentRolesOf(
  accents: StylePack["colors"]["accents"],
): Pick<StylePack["colors"], "accent" | "bullet" | "bars"> {
  const [first, second, third, fourth] = accents;
  return { accent: first, bullet: third, bars: [second, third, fourth] };
}

export function bundledFont(options: {
  family: string;
  weight: number;
  file: URL;
  fallbackFamilies?: string;
}): StyleFont {
  return {
    family: options.family,
    weight: options.weight,
    fallbackFamilies: options.fallbackFamilies ?? "system-ui, sans-serif",
    file: options.file,
  };
}
