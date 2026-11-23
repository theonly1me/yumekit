import { describe, expect, it } from "vitest";
import { holdSplit, paceFrame, sequence, words } from "../motion.js";

describe("sequence", () => {
  it("staggers each item by the given seconds", () => {
    expect(
      sequence({
        count: 3,
        framesPerSecond: 30,
        startFrame: 10,
        eachSeconds: 0.2,
      }),
    ).toEqual([10, 16, 22]);
  });

  it("shortens the stagger so the last item settles by 70 percent of the clip", () => {
    const starts = sequence({
      count: 6,
      framesPerSecond: 30,
      eachSeconds: 0.5,
      itemSeconds: 0.5,
      durationFrames: 61,
    });
    expect((starts.at(-1) ?? 0) + 15).toBeCloseTo(42, 6);
  });

  it("starts each item on a beat with every beat, and rounds a beat to a frame", () => {
    expect(
      sequence({
        count: 4,
        framesPerSecond: 30,
        startFrame: 3,
        every: "beat",
        beatFrames: 14.0625,
        durationFrames: 30,
      }),
    ).toEqual([3, 17, 31, 45]);
  });

  it("starts each item on a half beat with every half-beat", () => {
    expect(
      sequence({
        count: 3,
        framesPerSecond: 30,
        every: "half-beat",
        beatFrames: 15,
      }),
    ).toEqual([0, 8, 15]);
  });

  it("keeps the even stagger when the project has no tempo", () => {
    expect(
      sequence({
        count: 3,
        framesPerSecond: 30,
        every: "beat",
        eachSeconds: 0.2,
      }),
    ).toEqual([0, 6, 12]);
  });
});

describe("holdSplit", () => {
  it("splits a clip into in, hold, and out by the rule of the guide", () => {
    expect(holdSplit({ durationFrames: 101 })).toEqual({
      in: { startFrame: 0, endFrame: 25 },
      hold: { startFrame: 25, endFrame: 90 },
      out: { startFrame: 90, endFrame: 100 },
      settleFrame: 70,
    });
  });
});

describe("paceFrame", () => {
  it("keeps the frame when the motion settles by 70 percent of the clip", () => {
    expect(paceFrame({ frame: 12, durationFrames: 91, settleFrame: 40 })).toBe(
      12,
    );
  });

  it("runs faster in a short clip, and shows the settled frame in a clip of 1 frame", () => {
    expect(paceFrame({ frame: 14, durationFrames: 21, settleFrame: 28 })).toBe(
      28,
    );
    expect(paceFrame({ frame: 0, durationFrames: 1, settleFrame: 28 })).toBe(
      28,
    );
  });
});

describe("words", () => {
  it("gives each word its own start and the frame where the last one settles", () => {
    const result = words({
      text: "  One   small step ",
      frame: 0,
      framesPerSecond: 30,
      startFrame: 4,
      eachSeconds: 0.1,
      wordSeconds: 0.5,
    });
    expect(result.words.map((word) => [word.text, word.startFrame])).toEqual([
      ["One", 4],
      ["small", 7],
      ["step", 10],
    ]);
    expect(result.settleFrame).toBe(25);
  });
});
