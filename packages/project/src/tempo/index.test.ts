import { describe, expect, it } from "vitest";
import {
  beatFramesOfSpan,
  beatOfFrame,
  frameOfBeat,
  framesPerBeatOf,
} from "../index.js";

const grid = { tempo: 120, framesPerSecond: 30 };

describe("the beat grid of a tempo", () => {
  it("puts beat 8 at frame 120 at tempo 120 and 30 frames each second", () => {
    expect(framesPerBeatOf(grid)).toBe(15);
    expect(frameOfBeat({ grid, beat: 8 })).toBe(120);
    expect(beatOfFrame({ grid, frame: 120 })).toBe(8);
  });

  it("rounds a beat to the nearest frame when a beat is not a whole number of frames", () => {
    const odd = { tempo: 128, framesPerSecond: 30 };

    expect(framesPerBeatOf(odd)).toBe(14.0625);
    expect(frameOfBeat({ grid: odd, beat: 3 })).toBe(42);
    expect(frameOfBeat({ grid: odd, beat: 0.5 })).toBe(7);
  });

  it("gives a span the frames from its rounded start to its rounded end, so clips that touch in beats touch in frames", () => {
    const odd = { tempo: 128, framesPerSecond: 30 };
    const first = beatFramesOfSpan({
      grid: odd,
      startBeat: 0.5,
      durationBeats: 2.5,
    });
    const second = beatFramesOfSpan({
      grid: odd,
      startBeat: 3,
      durationBeats: 1,
    });

    expect(first.startFrame + first.durationFrames).toBe(second.startFrame);
  });
});
