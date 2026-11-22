import { framesOf } from "./curves.js";
import { enter, type EnterOptions } from "./enter.js";
import type { MotionStyle } from "./motionStyle.js";

export interface MotionWord {
  text: string;
  startFrame: number;
  style: MotionStyle;
}

const defaultEachSeconds = 0.09;
const defaultWordSeconds = 0.6;

export function words(
  options: Omit<EnterOptions, "durationSeconds"> & {
    text: string;
    eachSeconds?: number;
    wordSeconds?: number;
  },
): { words: MotionWord[]; settleFrame: number } {
  const { text, eachSeconds, wordSeconds, ...enterOptions } = options;
  const startFrame = options.startFrame ?? 0;
  const eachFrames = framesOf({
    seconds: eachSeconds ?? defaultEachSeconds,
    framesPerSecond: options.framesPerSecond,
  });
  const durationSeconds = wordSeconds ?? defaultWordSeconds;
  const parts = text.split(/\s+/).filter((part) => part !== "");
  const motionWords = [...parts.entries()].map(([index, part]) => {
    const wordStartFrame = startFrame + index * eachFrames;
    return {
      text: part,
      startFrame: wordStartFrame,
      style: enter({
        ...enterOptions,
        startFrame: wordStartFrame,
        durationSeconds,
      }),
    };
  });
  const lastStartFrame = motionWords.at(-1)?.startFrame ?? startFrame;
  return {
    words: motionWords,
    settleFrame:
      lastStartFrame +
      framesOf({
        seconds: durationSeconds,
        framesPerSecond: options.framesPerSecond,
      }),
  };
}
