import { contrastRatio } from "../stylePacks/contrast.js";
import type { StylePack } from "../stylePacks/stylePack.js";

const largeTextContrast = 3;

export interface SceneAccent {
  mark: string;
  text: string;
}

export function sceneAccentOf(stylePack: StylePack): SceneAccent {
  const { colors } = stylePack;
  const readable = [colors.accent, ...colors.accents].find(
    (accent) =>
      contrastRatio({ text: accent, background: colors.background }) >=
      largeTextContrast,
  );
  return readable === undefined
    ? { mark: colors.accent, text: colors.text }
    : { mark: readable, text: readable };
}

export function textOnAccent(options: {
  stylePack: StylePack;
  accent?: string;
}): string {
  const { colors } = options.stylePack;
  const accent = options.accent ?? colors.accent;
  const backgroundContrast = contrastRatio({
    text: colors.background,
    background: accent,
  });
  const textContrast = contrastRatio({ text: colors.text, background: accent });
  return backgroundContrast >= textContrast ? colors.background : colors.text;
}
