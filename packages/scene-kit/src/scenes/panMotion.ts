import { easings, tween } from "@yumekit/scene";
import type { panDirections } from "../schemas/imagePan.js";

export type PanDirection = (typeof panDirections)[number];

const panScale = 1.12;
const panShiftPercent = 5;
const zoomScale = 1.15;

interface PanPose {
  scale: number;
  shiftXPercent: number;
  shiftYPercent: number;
}

const startAndEndPoses: Record<PanDirection, readonly [PanPose, PanPose]> = {
  left: [
    { scale: panScale, shiftXPercent: -panShiftPercent, shiftYPercent: 0 },
    { scale: panScale, shiftXPercent: panShiftPercent, shiftYPercent: 0 },
  ],
  right: [
    { scale: panScale, shiftXPercent: panShiftPercent, shiftYPercent: 0 },
    { scale: panScale, shiftXPercent: -panShiftPercent, shiftYPercent: 0 },
  ],
  up: [
    { scale: panScale, shiftXPercent: 0, shiftYPercent: -panShiftPercent },
    { scale: panScale, shiftXPercent: 0, shiftYPercent: panShiftPercent },
  ],
  down: [
    { scale: panScale, shiftXPercent: 0, shiftYPercent: panShiftPercent },
    { scale: panScale, shiftXPercent: 0, shiftYPercent: -panShiftPercent },
  ],
  in: [
    { scale: 1, shiftXPercent: 0, shiftYPercent: 0 },
    { scale: zoomScale, shiftXPercent: 0, shiftYPercent: 0 },
  ],
  out: [
    { scale: zoomScale, shiftXPercent: 0, shiftYPercent: 0 },
    { scale: 1, shiftXPercent: 0, shiftYPercent: 0 },
  ],
};

export function panTransform(options: {
  direction: PanDirection;
  frame: number;
  durationFrames: number;
}): string {
  const [start, end] = startAndEndPoses[options.direction];
  const between = (pick: (pose: PanPose) => number) =>
    tween({
      frame: options.frame,
      startFrame: 0,
      endFrame: Math.max(1, options.durationFrames - 1),
      from: pick(start),
      to: pick(end),
      easing: easings.easeInOut,
    });
  const shiftX = between((pose) => pose.shiftXPercent);
  const shiftY = between((pose) => pose.shiftYPercent);
  const scale = between((pose) => pose.scale);
  return `translate(${String(shiftX)}%, ${String(shiftY)}%) scale(${String(scale)})`;
}
