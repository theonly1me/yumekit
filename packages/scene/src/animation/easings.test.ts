import { describe, expect, it } from "vitest";
import { easings } from "../index.js";

describe("easings", () => {
  it("returns the progress for linear", () => {
    expect(easings.linear(0.37)).toBe(0.37);
  });

  it("matches the CSS ease-in curve at bezier time 0.5", () => {
    expect(easings.easeIn(0.6575)).toBeCloseTo(0.5, 6);
  });

  it("matches the CSS ease-out curve at bezier time 0.5", () => {
    expect(easings.easeOut(0.3425)).toBeCloseTo(0.5, 6);
  });

  it("matches the CSS ease-in-out curve at bezier times 0.25 and 0.5", () => {
    expect(easings.easeInOut(0.274375)).toBeCloseTo(0.15625, 6);
    expect(easings.easeInOut(0.5)).toBeCloseTo(0.5, 6);
  });

  it("starts at 0 and ends at 1 for each named easing", () => {
    for (const easing of [easings.easeIn, easings.easeOut, easings.easeInOut]) {
      expect(easing(0)).toBeCloseTo(0, 6);
      expect(easing(1)).toBeCloseTo(1, 6);
    }
  });

  it("gives a straight line for control points on the diagonal", () => {
    const diagonal = easings.cubicBezier({
      x1: 0.25,
      y1: 0.25,
      x2: 0.75,
      y2: 0.75,
    });
    expect(diagonal(0.3)).toBeCloseTo(0.3, 6);
  });

  it("clamps cubicBezier progress before 0 and after 1", () => {
    const easing = easings.cubicBezier({ x1: 0.1, y1: 0.7, x2: 0.3, y2: 0.9 });
    expect(easing(-0.5)).toBe(0);
    expect(easing(1.5)).toBe(1);
  });
});
