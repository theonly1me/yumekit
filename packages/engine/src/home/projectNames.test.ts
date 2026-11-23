import { describe, expect, it } from "vitest";
import { projectNameOf } from "./projectNames.js";

describe("the first name of a project", () => {
  it("is the first words of the idea, cut at a word and at 40 letters", () => {
    expect(
      projectNameOf("Extraordinary unbelievable spectacular wonderful tea"),
    ).toBe("Extraordinary unbelievable spectacular");
  });

  it("keeps a short idea whole, with no end mark", () => {
    expect(projectNameOf("a tea ad.")).toBe("A tea ad");
  });
});
