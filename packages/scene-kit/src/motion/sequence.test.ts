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
