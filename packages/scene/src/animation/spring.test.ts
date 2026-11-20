import { describe, expect, it } from "vitest";
import { spring } from "../index.js";

const fromZeroToOne = { startFrame: 0, framesPerSecond: 30, from: 0, to: 1 };

describe("spring", () => {
  it("returns from at and before the start frame", () => {
    expect(spring({ ...fromZeroToOne, startFrame: 10, frame: 10 })).toBe(0);
    expect(spring({ ...fromZeroToOne, startFrame: 10, frame: -3 })).toBe(0);
  });

  it("matches a numeric integration with the default underdamped spring", () => {
    expect(spring({ ...fromZeroToOne, frame: 3 })).toBeCloseTo(0.3403, 4);
  });

  it("matches a numeric integration with critical damping", () => {
    const value = spring({ ...fromZeroToOne, frame: 3, damping: 20 });
    expect(value).toBeCloseTo(1 - 2 / Math.E, 6);
  });

  it("matches a numeric integration with overdamping", () => {
    expect(spring({ ...fromZeroToOne, frame: 3, damping: 50 })).toBeCloseTo(
      0.1518,
      4,
    );
  });

  it("uses stiffness and mass", () => {
    const value = spring({
      ...fromZeroToOne,
      frame: 15,
      stiffness: 200,
      mass: 2,
    });
    expect(value).toBeCloseTo(1.0366, 4);
  });

  it("measures time from the start frame in seconds", () => {
    const shifted = spring({ ...fromZeroToOne, startFrame: 40, frame: 43 });
    expect(shifted).toBeCloseTo(spring({ ...fromZeroToOne, frame: 3 }), 10);
  });

  it("settles on to at a late frame", () => {
    expect(spring({ ...fromZeroToOne, frame: 500 })).toBeCloseTo(1, 10);
  });
});
