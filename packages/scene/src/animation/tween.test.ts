import { describe, expect, it } from "vitest";
import { easings, tween } from "../index.js";

const linearRange = {
  startFrame: 10,
  endFrame: 20,
  from: 100,
  to: 200,
  easing: easings.linear,
};

describe("tween", () => {
  it("returns from at and before the start frame", () => {
    expect(tween({ ...linearRange, frame: 10 })).toBe(100);
    expect(tween({ ...linearRange, frame: -50 })).toBe(100);
  });

  it("returns to at and after the end frame", () => {
    expect(tween({ ...linearRange, frame: 20 })).toBe(200);
    expect(tween({ ...linearRange, frame: 900 })).toBe(200);
  });

  it("moves in proportion to the frame with linear easing", () => {
    expect(tween({ ...linearRange, frame: 13 })).toBeCloseTo(130, 10);
  });

  it("uses easeInOut when no easing is given", () => {
    const value = tween({
      frame: 274.375,
      startFrame: 0,
      endFrame: 1000,
      from: 0,
      to: 1,
    });
    expect(value).toBeCloseTo(0.15625, 6);
  });

  it("jumps to to when the start and end frames are equal", () => {
    const range = { startFrame: 5, endFrame: 5, from: 0, to: 1 };
    expect(tween({ ...range, frame: 4 })).toBe(0);
    expect(tween({ ...range, frame: 6 })).toBe(1);
  });
});
