import { useFrame, useSceneContext } from "@yumekit/scene";
import { enter, paceFrame, type MotionStyle } from "../motion/index.js";
import { useStylePack } from "../stylePacks/StylePackContext.js";

const secondsOfBeatWithNoTempo = 0.5;
const entrySeconds = 0.5;
const entryDistanceUnits = 2.5;

export interface FilmTiming {
  frame: number;
  pacedFrame: number;
  framesPerSecond: number;
  beatFrames: number;
  frameOfBeat: (beat: number) => number;
  enterAt: (beat: number) => MotionStyle;
}

export function useBeatFrames(): number {
  const { beatFrames, framesPerSecond } = useSceneContext();
  return beatFrames !== undefined && beatFrames > 0
    ? beatFrames
    : secondsOfBeatWithNoTempo * framesPerSecond;
}

export function useFilmTiming(options: {
  lastEntryBeat: number;
  tailSeconds?: number;
}): FilmTiming {
  const frame = useFrame();
  const { framesPerSecond, durationFrames, unit } = useSceneContext();
  const calm = useStylePack().motion.calm === true;
  const beatFrames = useBeatFrames();
  const frameOfBeat = (beat: number) => Math.round(beat * beatFrames);
  const settleFrame =
    frameOfBeat(options.lastEntryBeat) +
    Math.max(entrySeconds, options.tailSeconds ?? 0) * framesPerSecond;
  const pacedFrame = paceFrame({ frame, durationFrames, settleFrame });
  return {
    frame,
    pacedFrame,
    framesPerSecond,
    beatFrames,
    frameOfBeat,
    enterAt: (beat) =>
      enter({
        frame: pacedFrame,
        framesPerSecond,
        startFrame: frameOfBeat(beat),
        kind: "rise",
        durationSeconds: entrySeconds,
        unit,
        distanceUnits: entryDistanceUnits,
        calm,
      }),
  };
}
