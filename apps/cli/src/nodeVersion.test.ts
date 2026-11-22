import { describe, expect, it } from "vitest";
import { nodeVersionProblemOf } from "./nodeVersion.js";

describe("the Node.js version check", () => {
  it("stops Node.js 20 with one sentence", () => {
    expect(nodeVersionProblemOf("20.19.1")).toBe(
      "yumekit needs Node.js 22 or later. This is Node.js 20.19.1.",
    );
  });

  it("accepts Node.js 22 and later", () => {
    expect(nodeVersionProblemOf("22.0.0")).toBeUndefined();
    expect(nodeVersionProblemOf("24.14.1")).toBeUndefined();
  });
});
