import { describe, expect, it } from "vitest";
import { seededRandom } from "../index.js";

function take(options: { seed: string; count: number }): number[] {
  const random = seededRandom(options.seed);
  return Array.from({ length: options.count }, () => random());
}

describe("seededRandom", () => {
  it("gives the same sequence for the same seed", () => {
    expect(take({ seed: "intro", count: 50 })).toEqual(
      take({ seed: "intro", count: 50 }),
    );
  });

  it("gives a different sequence for a different seed", () => {
    expect(take({ seed: "intro", count: 5 })).not.toEqual(
      take({ seed: "outro", count: 5 }),
    );
  });

  it("gives values from 0 up to but not including 1", () => {
    const values = take({ seed: "range", count: 10000 });
    expect(values.every((value) => value >= 0 && value < 1)).toBe(true);
  });

  it("spreads values evenly across ten equal bins", () => {
    const values = take({ seed: "spread", count: 10000 });
    const counts = [...Array(10).keys()].map(
      (bin) => values.filter((value) => Math.floor(value * 10) === bin).length,
    );
    expect(counts.every((count) => count > 900 && count < 1100)).toBe(true);
  });

  it("does not repeat a value in a short sequence", () => {
    const values = take({ seed: "", count: 1000 });
    expect(new Set(values).size).toBe(1000);
  });
});
