import { describe, expect, it } from "vitest";
import { enter, enterKinds, exit } from "../motion.js";

const atThirty = { framesPerSecond: 30, unit: 10 };

describe("enter", () => {
  for (const kind of enterKinds) {
    it(`settles ${kind} to the plain picture at the end of its length`, () => {
      expect(
        enter({ ...atThirty, kind, frame: 18, durationSeconds: 0.6 }),
      ).toEqual({ opacity: 1, transform: "none" });
    });

    it(`hides ${kind} before its start frame`, () => {
      const style = enter({ ...atThirty, kind, frame: 4, startFrame: 5 });
      const hidden =
        style.opacity === 0 || (style.clipPath ?? "").includes(" 100% ");
      expect(hidden).toBe(true);
    });
  }

  it("rises from the given distance with an ease out curve", () => {
    const early = enter({ ...atThirty, frame: 3, durationSeconds: 0.6 });
    expect(early.transform).toMatch(/^translateY\(/);
    const offset = Number.parseFloat(early.transform.slice(11));
    expect(offset).toBeGreaterThan(0);
    expect(offset).toBeLessThan(50 * (1 - 3 / 18));
  });

  it("overshoots a little with pop and comes back to full size", () => {
    const scales = Array.from({ length: 18 }, (...[, frame]) =>
      Number.parseFloat(
        enter({ ...atThirty, kind: "pop", frame }).transform.slice(6),
      ),
    ).filter((scale) => !Number.isNaN(scale));
    const largest = Math.max(...scales);
    expect(largest).toBeGreaterThan(1);
    expect(largest).toBeLessThan(1.15);
  });

  it("has the same length in seconds at 30 and at 60 frames each second", () => {
    expect(enter({ frame: 9, framesPerSecond: 30, unit: 10 })).toEqual(
      enter({ frame: 18, framesPerSecond: 60, unit: 10 }),
    );
  });

  it("gives a fade for each kind in a calm look", () => {
    for (const kind of enterKinds) {
      expect(enter({ ...atThirty, kind, frame: 5, calm: true })).toEqual(
        enter({ ...atThirty, kind: "fade", frame: 5 }),
      );
    }
  });
});

describe("exit", () => {
  it("keeps the plain picture before its last frames and hides at the end", () => {
    expect(exit({ ...atThirty, frame: 60, endFrame: 89 })).toEqual({
      opacity: 1,
      transform: "none",
    });
    expect(exit({ ...atThirty, frame: 89, endFrame: 89 }).opacity).toBe(0);
  });

  it("reverses the entry of the same kind", () => {
    const leaving = exit({
      ...atThirty,
      kind: "rise",
      frame: 85,
      endFrame: 89,
    });
    expect(leaving.opacity).toBeGreaterThan(0);
    expect(leaving.opacity).toBeLessThan(1);
    expect(leaving.transform).toMatch(/^translateY\(/);
  });
});
