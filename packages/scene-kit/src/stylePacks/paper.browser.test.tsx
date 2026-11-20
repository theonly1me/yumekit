import { describe, expect, it } from "vitest";
import { loadStylePackFonts, paper } from "../index.js";

describe("paper from the main entry", () => {
  it("gives the colors and the font family names of the paper style pack", () => {
    expect(paper.colors).toMatchObject({
      background: "#eef1f4",
      text: "#18203a",
      accent: "#f2b33d",
      bullet: "#4db6ae",
      bars: ["#e891ab", "#4db6ae", "#a294e0"],
    });
    expect(paper.fonts.display.family).toBe("Zen Maru Gothic");
    expect(paper.fonts.body.family).toBe("Zen Kaku Gothic New");
  });

  it("loads both paper fonts with loadStylePackFonts and no kit scene on the page", async () => {
    await loadStylePackFonts(paper);

    const loaded = [...document.fonts]
      .filter((face) => face.status === "loaded")
      .map((face) => `${face.family} ${face.weight}`)
      .toSorted();
    expect(loaded).toEqual(["Zen Kaku Gothic New 500", "Zen Maru Gothic 700"]);
  });
});
