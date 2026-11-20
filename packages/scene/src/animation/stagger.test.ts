import { describe, expect, it } from "vitest";
import { stagger } from "../index.js";

describe("stagger", () => {
  it("starts item 0 at the start frame", () => {
    expect(stagger({ index: 0, startFrame: 12, eachFrames: 5 })).toBe(12);
  });

  it("adds eachFrames for each item before the index", () => {
    expect(stagger({ index: 3, startFrame: 12, eachFrames: 5 })).toBe(27);
  });
});
