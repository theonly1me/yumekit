import { tween, useFrame, useSceneContext } from "@yumekit/scene";
import type { CSSProperties } from "react";
import { useStylePack } from "../stylePacks/StylePackContext.js";
import type { StylePack } from "../stylePacks/stylePack.js";

export function useMotionFrame(options: { settleFrame: number }): number {
  const frame = useFrame();
  const { durationFrames, framesPerSecond } = useSceneContext();
  const { motion } = useStylePack();
  const referenceFramesEach = motion.referenceFramesPerSecond / framesPerSecond;
  const lastFrame = (durationFrames - 1) * referenceFramesEach;
  if (lastFrame <= 0) {
    return options.settleFrame;
  }
  const settleLimit = lastFrame * motion.settleShareOfClip;
  const speed = Math.max(1, options.settleFrame / settleLimit);
  return frame * referenceFramesEach * speed;
}

export function riseStyle(options: {
  motionFrame: number;
  startFrame: number;
  stylePack: StylePack;
  unit: number;
}): CSSProperties {
  const { motion } = options.stylePack;
  const progress = tween({
    frame: options.motionFrame,
    startFrame: options.startFrame,
    endFrame: options.startFrame + motion.riseFrames,
    from: 0,
    to: 1,
  });
  const offset = (1 - progress) * motion.riseDistanceUnits * options.unit;
  return { opacity: progress, transform: `translateY(${String(offset)}px)` };
}
