import type { LookId } from "../looks/looks.js";

export interface StyleFont {
  family: string;
  weight: number;
  fallbackFamilies: string;
  file: URL;
}

export interface TextUnits {
  title: number;
  quote: number;
  heading: number;
  item: number;
  value: number;
  label: number;
  caption: number;
  number: number;
  statement: number;
}

export const backdropKinds = ["flat", "glow", "grid", "grain"] as const;

export type BackdropKind = (typeof backdropKinds)[number];

export interface StylePack {
  id: LookId;
  name: string;
  label: string;
  backdrop: BackdropKind;
  cornerUnits: number;
  colors: {
    background: string;
    surface: string;
    accents: readonly [string, string, string, string];
    glow: readonly [string, string];
    text: string;
    mutedText: string;
    accent: string;
    bullet: string;
    bars: readonly [string, ...string[]];
    placeholder: string;
    captionPanel: string;
    captionText: string;
  };
  fonts: {
    display: StyleFont;
    body: StyleFont;
  };
  motion: {
    referenceFramesPerSecond: number;
    riseFrames: number;
    riseDistanceUnits: number;
    staggerFrames: number;
    wordStaggerFrames: number;
    settleShareOfClip: number;
  };
  layout: {
    marginUnits: number;
    captionAreaUnits: number;
    barUnits: number;
    longestBarShare: number;
    stackedLongestBarShare: number;
    bulletShareOfItem: number;
    itemGapShareOfItem: number;
    wideHeadingColumnUnits: number;
    wideContentColumnStartUnits: number;
    wideQuoteUnits: number;
    wideTitleUnits: number;
  };
  textUnits: {
    wide: TextUnits;
    square: TextUnits;
    tall: TextUnits;
  };
}

export function fontFamilyOf(font: StyleFont): string {
  return `"${font.family}", ${font.fallbackFamilies}`;
}
