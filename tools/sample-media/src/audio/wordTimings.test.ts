import { describe, expect, it } from "vitest";
import { evenWordTimings, splitWords } from "./wordTimings.ts";

describe("word timings", () => {
  it("splits text on any run of white space and drops empty words", () => {
    expect(splitWords("  one  two\nthree\t")).toEqual(["one", "two", "three"]);
  });

  it("divides the duration evenly and rounds each time to microseconds", () => {
    expect(
      evenWordTimings({ words: ["a", "b", "c"], durationSeconds: 0.9 }),
    ).toEqual([
      { text: "a", start_seconds: 0, end_seconds: 0.3 },
      { text: "b", start_seconds: 0.3, end_seconds: 0.6 },
      { text: "c", start_seconds: 0.6, end_seconds: 0.9 },
    ]);
  });
});
