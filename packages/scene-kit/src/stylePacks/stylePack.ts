export interface StyleFont {
  family: string;
  weight: number;
  fallbackFamilies: string;
  file: URL;
}

export interface StylePack {
  name: string;
  colors: {
    background: string;
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
    tallTextScale: number;
  };
  textUnits: {
    title: number;
    heading: number;
    chartHeading: number;
    quote: number;
    item: number;
    value: number;
    label: number;
    subheading: number;
    caption: number;
    tallCaption: number;
  };
}

export function fontFamilyOf(font: StyleFont): string {
  return `"${font.family}", ${font.fallbackFamilies}`;
}
