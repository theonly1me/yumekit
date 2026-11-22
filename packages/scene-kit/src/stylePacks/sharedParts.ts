import type { StyleFont, StylePack } from "./stylePack.js";

export const sharedMotion: StylePack["motion"] = {
  referenceFramesPerSecond: 30,
  riseFrames: 14,
  riseDistanceUnits: 6,
  staggerFrames: 20,
  wordStaggerFrames: 12,
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
