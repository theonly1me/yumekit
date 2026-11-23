import { useFrame, useSceneContext } from "@yumekit/scene";
import {
  drift,
  enter,
  paceFrame,
  type DriftKind,
  type DriftPose,
  type EnterKind,
  type MotionStyle,
} from "../motion/index.js";
import { useStylePack } from "../stylePacks/StylePackContext.js";

export interface KitMotion {
  calm: boolean;
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
  const calm = motion.calm === true;
  return {
    calm,
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
        calm,
      }),
    drift: (kind) =>
      drift({
        frame,
        framesPerSecond,
        durationFrames,
        kind,
        unit,
        calm,
      }),
  };
}
