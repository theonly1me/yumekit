import { describe, expect, it } from "vitest";
import { countUp, draw, drift, pulse, typed } from "../motion.js";

describe("countUp", () => {
  it("counts from the start to the exact end value with its format", () => {
    const options = { framesPerSecond: 30, to: 1240, prefix: "$" };
    expect(countUp({ ...options, frame: 0 }).text).toBe("$0");
    expect(countUp({ ...options, frame: 36 })).toEqual({
      value: 1240,
      text: "$1,240",
    });
    const halfway = countUp({ ...options, frame: 18 }).value;
    expect(halfway).toBeGreaterThan(620);
    expect(halfway).toBeLessThan(1240);
  });

  it("keeps the decimals of the end value", () => {
    expect(countUp({ framesPerSecond: 30, to: 2.5, frame: 90 }).text).toBe(
      "2.5",
    );
  });
});

describe("typed", () => {
  it("shows the characters typed by the frame, with a cursor", () => {
    const options = { text: "Make a video", framesPerSecond: 30 };
    expect(typed({ ...options, frame: 5, charactersPerSecond: 12 })).toEqual({
      shown: "Ma",
      cursorVisible: true,
      done: false,
    });
    expect(typed({ ...options, frame: 30 }).shown).toBe("Make a video");
  });

  it("blinks the cursor after the line is typed", () => {
    const options = { text: "Hi", framesPerSecond: 30, blinkSeconds: 0.5 };
    expect(typed({ ...options, frame: 20 }).cursorVisible).toBe(false);
    expect(typed({ ...options, frame: 31 }).cursorVisible).toBe(true);
  });
});

describe("drift", () => {
  const options = { framesPerSecond: 30, durationFrames: 90 };

  it("moves on each frame of the clip and rests at the last frame", () => {
    const scales = Array.from(
      { length: 89 },
      (...[, frame]) => drift({ ...options, frame }).scale,
    );
    expect(new Set(scales).size).toBe(89);
    expect(drift({ ...options, frame: 89 }).transform).toBe("none");
  });

  it("stays small and gives no move in a calm look", () => {
    expect(drift({ ...options, frame: 0 }).scale).toBeLessThanOrEqual(1.04);
    expect(drift({ ...options, frame: 0, calm: true }).transform).toBe("none");
  });

  it("moves in a direction that comes from the seed", () => {
    const moved = (seed: string) =>
      drift({ ...options, frame: 0, kind: "move", seed }).transform;
    expect(moved("one")).toBe(moved("one"));
    expect(moved("one")).not.toBe(moved("two"));
  });
});

describe("pulse and draw", () => {
  it("scales up and back once around the marked frame", () => {
    const options = { framesPerSecond: 30, atFrame: 30, durationSeconds: 0.4 };
    expect(pulse({ ...options, frame: 30 })).toBe(1);
    expect(pulse({ ...options, frame: 36 })).toBeCloseTo(1.08, 6);
    expect(pulse({ ...options, frame: 42 })).toBe(1);
  });

  it("draws a share from 0 to 1", () => {
    const options = { framesPerSecond: 30, startFrame: 10 };
    expect(draw({ ...options, frame: 10 })).toBe(0);
    expect(draw({ ...options, frame: 20.5 })).toBeCloseTo(0.5, 6);
    expect(draw({ ...options, frame: 31 })).toBe(1);
  });
});
