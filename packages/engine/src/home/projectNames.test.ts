import { describe, expect, it } from "vitest";
import { folderNameOf, projectNameOf } from "./projectNames.js";

describe("the first name of a project", () => {
  it("is the first words of the idea, cut at a word and at 40 letters", () => {
    expect(
      projectNameOf("Extraordinary unbelievable spectacular wonderful tea"),
    ).toBe("Extraordinary unbelievable spectacular");
  });

  it("keeps a short idea whole, with no end mark", () => {
    expect(projectNameOf("a tea ad.")).toBe("A tea ad");
  });

  it("comes from the first filled line of a template guide, so two trailers get two names", () => {
    const request =
      "A trailer, about 60 seconds.\nThe story: a girl carries a new bell to the island\nThe main characters: \nThe look: ";

    expect(projectNameOf(request)).toBe("A girl carries a new bell");
    expect(folderNameOf(request)).toBe("a-girl-carries-a-new-bell");
  });

  it("ends on a word that carries meaning, not on an article or a small link word", () => {
    expect(
      projectNameOf("Before the winter fog closes the sea, a girl rows"),
    ).toBe("Before the winter fog closes");
  });

  it("keeps the first line of a guide that has no filled line", () => {
    expect(projectNameOf("A trailer, about 60 seconds.\nThe story: ")).toBe(
      "A trailer, about 60 seconds",
    );
  });
});
