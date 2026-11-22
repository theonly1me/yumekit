import { describe, expect, it } from "vitest";
import {
  countUp,
  draw,
  drift,
  enter,
  enterKinds,
  pulse,
  typed,
  words,
} from "../motion.js";

const durationFrames = 90;
const framesPerSecond = 30;

function everyValueAt(frame: number) {
  return {
    entries: enterKinds.map((kind) =>
      enter({ kind, frame, framesPerSecond, startFrame: 4, unit: 10 }),
    ),
    words: words({ text: "One small step", frame, framesPerSecond }),
    typed: typed({ text: "Hello there", frame, framesPerSecond }),
    count: countUp({ frame, framesPerSecond, to: 128 }),
    drift: drift({ frame, framesPerSecond, durationFrames, kind: "move" }),
    pulse: pulse({ frame, framesPerSecond, atFrame: 50 }),
    draw: draw({ frame, framesPerSecond, startFrame: 20 }),
  };
}

describe("each motion function is a pure function of the frame", () => {
  it("gives frame 60 the same values after a seek and after frames 0 to 59", () => {
    const direct = everyValueAt(60);
    for (let frame = 0; frame < 60; frame += 1) {
      everyValueAt(frame);
    }
    expect(everyValueAt(60)).toEqual(direct);
  });

  it("gives the same values for each frame in any order of seeks", () => {
    const frames = Array.from(
      { length: durationFrames },
      (...[, frame]) => frame,
    );
    const forward = frames.map(everyValueAt);
    const backward = frames.toReversed().map(everyValueAt).toReversed();
    expect(backward).toEqual(forward);
  });

  it("gives the settled value of each function at the last frame", () => {
    const last = everyValueAt(durationFrames - 1);
    for (const style of last.entries) {
      expect(style).toEqual({ opacity: 1, transform: "none" });
    }
    expect(last.count.value).toBe(128);
    expect(last.typed.done).toBe(true);
    expect(last.drift.transform).toBe("none");
    expect(last.pulse).toBe(1);
    expect(last.draw).toBe(1);
  });
});
