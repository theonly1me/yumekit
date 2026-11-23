import { framesOf } from "./curves.js";
import { holdSplit } from "./holdSplit.js";

const defaultEachSeconds = 0.15;
const defaultItemSeconds = 0.6;

export type SequenceBeat = "beat" | "half-beat";

const beatShares: Record<SequenceBeat, number> = { beat: 1, "half-beat": 0.5 };

export function sequence(options: {
  count: number;
  framesPerSecond: number;
  startFrame?: number;
  eachSeconds?: number;
  itemSeconds?: number;
  durationFrames?: number;
  every?: SequenceBeat;
  beatFrames?: number;
}): number[] {
  const { framesPerSecond, every, beatFrames } = options;
  const count = Math.max(0, Math.floor(options.count));
  const startFrame = options.startFrame ?? 0;
  if (every !== undefined && beatFrames !== undefined && beatFrames > 0) {
    return Array.from({ length: count }, (...[, index]) =>
      Math.round(startFrame + index * beatFrames * beatShares[every]),
    );
  }
  const eachFrames = framesOf({
    seconds: options.eachSeconds ?? defaultEachSeconds,
    framesPerSecond,
  });
  const itemFrames = framesOf({
    seconds: options.itemSeconds ?? defaultItemSeconds,
    framesPerSecond,
  });
  const gaps = Math.max(1, count - 1);
  const fittedEachFrames =
    options.durationFrames === undefined
      ? eachFrames
      : Math.min(
          eachFrames,
          Math.max(
            0,
            (holdSplit({ durationFrames: options.durationFrames }).settleFrame -
              itemFrames -
              startFrame) /
              gaps,
          ),
        );
  return Array.from(
    { length: count },
    (...[, index]) => startFrame + index * fittedEachFrames,
  );
}
