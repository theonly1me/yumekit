import type { KitMotion } from "../../kit/motion.js";
import { sequence } from "../../motion/index.js";

const leftTitleFrame = 2;
const firstRowFrame = 8;
const rowStaggerFrames = 5;
const sideGapFrames = 6;
const checkDelayFrames = 6;
const checkFrames = 10;

export interface CompareTiming {
  leftTitle: number;
  leftRows: number[];
  rightCard: number;
  rightTitle: number;
  rightRows: number[];
  checkStart: (index: number) => number;
  checkSeconds: number;
  settleFrame: number;
}

export function compareTimingOf(options: {
  motion: KitMotion;
  rowCount: number;
}): CompareTiming {
  const { motion, rowCount } = options;
  const rowsFrom = (startFrame: number) =>
    sequence({
      count: rowCount,
      framesPerSecond: motion.framesPerSecond,
      startFrame,
      eachSeconds: motion.framesOf(rowStaggerFrames) / motion.framesPerSecond,
      itemSeconds: motion.itemSeconds,
    });
  const leftRows = rowsFrom(motion.framesOf(firstRowFrame));
  const rightCard =
    (leftRows.at(-1) ?? motion.framesOf(firstRowFrame)) +
    motion.framesOf(sideGapFrames);
  const rightTitle = rightCard + motion.framesOf(4);
  const rightRows = rowsFrom(rightTitle + motion.framesOf(4));
  const checkStart = (index: number) =>
    (rightRows[index] ?? rightTitle) + motion.framesOf(checkDelayFrames);
  const lastCheck = checkStart(rowCount - 1) + motion.framesOf(checkFrames);
  return {
    leftTitle: motion.framesOf(leftTitleFrame),
    leftRows,
    rightCard,
    rightTitle,
    rightRows,
    checkStart,
    checkSeconds: motion.framesOf(checkFrames) / motion.framesPerSecond,
    settleFrame: Math.max(
      lastCheck,
      (rightRows.at(-1) ?? rightTitle) +
        motion.itemSeconds * motion.framesPerSecond,
    ),
  };
}
