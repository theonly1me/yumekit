import { useFrame, useSceneContext } from "@yumekit/scene";
import {
  drift,
  enter,
  paceFrame,
  type DriftKind,
  type DriftPose,
  type EnterKind,
  type MotionStyle,
  type MotionWord,
  words,
} from "../motion/index.js";
import { useStylePack } from "../stylePacks/StylePackContext.js";

export interface KitMotion {
  framesPerSecond: number;
  unit: number;
  itemSeconds: number;
  staggerFrames: number;
  wordStaggerSeconds: number;
  framesOf: (referenceFrames: number) => number;
  paced: (settleFrame: number) => number;
  enterAt: (options: {
    frame: number;
    startFrame: number;
    kind?: EnterKind;
    distanceUnits?: number;
  }) => MotionStyle;
  drift: (kind: DriftKind) => DriftPose;
  wordsFrom: (options: {
    text: string;
    startFrame: number;
    kind?: EnterKind;
    eachSeconds?: number;
  }) => (frame: number) => { words: MotionWord[]; settleFrame: number };
}

export function useKitMotion(): KitMotion {
  const frame = useFrame();
  const { durationFrames, framesPerSecond, unit } = useSceneContext();
  const { motion } = useStylePack();
  const secondsOf = (referenceFrames: number) =>
    referenceFrames / motion.referenceFramesPerSecond;
  const framesOf = (referenceFrames: number) =>
    secondsOf(referenceFrames) * framesPerSecond;
  const itemSeconds = secondsOf(motion.riseFrames);
  return {
    framesPerSecond,
    unit,
    itemSeconds,
    staggerFrames: framesOf(motion.staggerFrames),
    wordStaggerSeconds: secondsOf(motion.wordStaggerFrames),
    framesOf,
    paced: (settleFrame) => paceFrame({ frame, durationFrames, settleFrame }),
    enterAt: (options) =>
      enter({
        kind: "rise",
        distanceUnits: motion.riseDistanceUnits,
        ...options,
        framesPerSecond,
        unit,
        durationSeconds: itemSeconds,
      }),
    drift: (kind) =>
      drift({
        frame,
        framesPerSecond,
        durationFrames,
        kind,
        unit,
      }),
    wordsFrom: (options) => (wordFrame) =>
      words({
        eachSeconds: secondsOf(motion.wordStaggerFrames),
        ...options,
        frame: wordFrame,
        framesPerSecond,
        wordSeconds: itemSeconds,
        unit,
        distanceUnits: motion.riseDistanceUnits,
      }),
  };
}
