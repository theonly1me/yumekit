import type { StylePack } from "./stylePack.js";

export interface OwnColors {
  background: string;
  text: string;
  muted: string;
  accent: string;
}

export interface OwnLook {
  colors?: OwnColors;
  font?: string;
}

const ownDisplayWeight = 600;
const ownBodyWeight = 400;

function channelsOf(hex: string): [number, number, number] {
  const value = Number.parseInt(hex.slice(1), 16);
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
}

function hexOf(channels: number[]): string {
  return `#${channels
    .map((channel) => Math.round(channel).toString(16).padStart(2, "0"))
    .join("")}`;
}

function mixOf(options: { top: string; bottom: string; share: number }) {
  const top = channelsOf(options.top);
  const bottom = channelsOf(options.bottom);
  return hexOf(
    bottom.map((...[channel, index]) => {
      const target = top[index] ?? channel;
      return channel + (target - channel) * options.share;
    }),
  );
}

function translucentOf(options: { color: string; alpha: number }): string {
  const [red, green, blue] = channelsOf(options.color);
  return `rgb(${String(red)} ${String(green)} ${String(blue)} / ${String(options.alpha)})`;
}

function withOwnColors(options: {
  stylePack: StylePack;
  colors: OwnColors;
}): StylePack {
  const { stylePack, colors } = options;
  const surface = mixOf({
    top: colors.text,
    bottom: colors.background,
    share: 0.08,
  });
  return {
    ...stylePack,
    backdrop: "flat",
    colors: {
      background: colors.background,
      surface,
      accents: [colors.accent, colors.text, colors.muted, colors.accent],
      glow: [colors.accent, colors.accent],
      text: colors.text,
      mutedText: colors.muted,
      accent: colors.accent,
      bullet: colors.muted,
      bars: [colors.text, colors.muted, colors.accent],
      placeholder: surface,
      captionPanel: translucentOf({ color: surface, alpha: 0.92 }),
      captionText: colors.text,
    },
  };
}

function withOwnFont(options: {
  stylePack: StylePack;
  family: string;
}): StylePack {
  const { stylePack, family } = options;
  return {
    ...stylePack,
    fonts: {
      display: {
        family,
        weight: ownDisplayWeight,
        fallbackFamilies: stylePack.fonts.display.fallbackFamilies,
      },
      body: {
        family,
        weight: ownBodyWeight,
        fallbackFamilies: stylePack.fonts.body.fallbackFamilies,
      },
    },
  };
}

export function stylePackWithOwnLook(options: {
  stylePack: StylePack;
  own: OwnLook;
}): StylePack {
  const { own } = options;
  if (own.colors === undefined && own.font === undefined) {
    return options.stylePack;
  }
  const colored =
    own.colors === undefined
      ? options.stylePack
      : withOwnColors({ stylePack: options.stylePack, colors: own.colors });
  const styled =
    own.font === undefined
      ? colored
      : withOwnFont({ stylePack: colored, family: own.font });
  return {
    ...styled,
    name: `${options.stylePack.name}+${JSON.stringify(own)}`,
  };
}
