import { useFrame, useSceneContext } from "@yumekit/scene";
import { useBeatFrames } from "../../../film/filmTiming.js";
import { paceFrame } from "../../../motion/index.js";
import { useStylePack } from "../../../stylePacks/StylePackContext.js";
import type { TrailerCardProps } from "./readTrailerCardProps.js";

const fadeInSeconds = 0.12;
const wordsPush = 0.05;
const stillPushFrom = 1.04;
const stillPush = 0.06;

export interface CardTiming {
  wordsShown: boolean;
  wordsOpacity: number;
  wordsScale: number;
  stillScale: number;
  isFlashFrame: boolean;
}

function clampedShare(options: { from: number; to: number; at: number }) {
  const span = Math.max(1, options.to - options.from);
  return Math.min(1, Math.max(0, (options.at - options.from) / span));
}

export function useCardTiming(card: TrailerCardProps): CardTiming {
  const frame = useFrame();
  const { framesPerSecond, durationFrames } = useSceneContext();
  const calm = useStylePack().motion.calm === true;
  const landFrame = Math.round(card.landsOnBeat * useBeatFrames());
  const fadeFrames = Math.max(1, Math.round(fadeInSeconds * framesPerSecond));
  const outFrame =
    card.holdSeconds === undefined
      ? durationFrames
      : landFrame + Math.round(card.holdSeconds * framesPerSecond);
  const pacedFrame = paceFrame({
    frame,
    durationFrames,
    settleFrame: landFrame + fadeFrames,
  });
  const pushShare = calm
    ? 0
    : clampedShare({
        from: landFrame,
        to: Math.min(outFrame, durationFrames),
        at: frame,
      });
  return {
    wordsShown: pacedFrame >= landFrame && frame < Math.max(1, outFrame),
    wordsOpacity: clampedShare({
      from: landFrame,
      to: landFrame + fadeFrames,
      at: pacedFrame,
    }),
    wordsScale: 1 + wordsPush * pushShare,
    stillScale:
      stillPushFrom +
      (calm
        ? 0
        : stillPush * clampedShare({ from: 0, to: durationFrames, at: frame })),
    isFlashFrame: card.flash && !calm && frame === landFrame,
  };
}
