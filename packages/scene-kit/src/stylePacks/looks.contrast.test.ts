import { describe, expect, it } from "vitest";
import { contrastRatio } from "./contrast.js";
import { stylePacks } from "./stylePacks.js";

const leastTextContrast = 4.5;

describe("the text colors of each look", () => {
  it("computes the contrast of black on white as 21 to 1", () => {
    expect(contrastRatio({ text: "#000000", background: "#ffffff" })).toBe(21);
  });

  for (const stylePack of Object.values(stylePacks)) {
    const { colors } = stylePack;

    it(`gives ${stylePack.id} text a contrast of 4.5 to 1 or more on its background`, () => {
      expect(
        contrastRatio({ text: colors.text, background: colors.background }),
      ).toBeGreaterThanOrEqual(leastTextContrast);
      expect(
        contrastRatio({
          text: colors.mutedText,
          background: colors.background,
        }),
      ).toBeGreaterThanOrEqual(leastTextContrast);
    });

    it(`gives ${stylePack.id} caption words a contrast of 4.5 to 1 or more on a white or a black picture`, () => {
      for (const under of ["#ffffff", "#000000"]) {
        expect(
          contrastRatio({
            text: colors.captionText,
            background: colors.captionPanel,
            under,
          }),
        ).toBeGreaterThanOrEqual(leastTextContrast);
      }
    });

    it(`sets the accent, the bullet, and the bars of ${stylePack.id} from its four accents`, () => {
      const [first, second, third, fourth] = colors.accents;
      expect({
        accent: colors.accent,
        bullet: colors.bullet,
        bars: colors.bars,
      }).toEqual({
        accent: first,
        bullet: third,
        bars: [second, third, fourth],
      });
    });
  }
});
