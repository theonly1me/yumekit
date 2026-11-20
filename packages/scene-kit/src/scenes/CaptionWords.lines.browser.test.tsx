import type { SceneOutput } from "@yumekit/scene";
import { describe, expect, it } from "vitest";
import {
  mountKitScene,
  squareOutput,
  tallOutput,
  wideOutput,
} from "../testing/mountKitScene.js";

const unitPixels = 1080 / 100;
const durationFrames = 300;
const wideLetterText =
  "We make warm, wonderful videos with many moving words. MOMA WOW. Women who work with WebM, MP4, and MKW formats know how much a single long caption weighs on a small phone. Watch each word.";

async function linesOfEachPage(output: SceneOutput) {
  const { element, mounted } = await mountKitScene({
    name: "caption-words",
    durationFrames,
    props: { text: wideLetterText },
    output,
  });
  const pages: { lines: number; fontUnits: number }[] = [];
  for (let frame = 0; frame < durationFrames; frame += 4) {
    await mounted.seek(frame);
    const panel = element.querySelector("p");
    if (panel === null) continue;
    const lineTops = new Set(
      [...panel.querySelectorAll("span")].map((word) =>
        Math.round(word.getBoundingClientRect().top),
      ),
    );
    pages.push({
      lines: lineTops.size,
      fontUnits:
        Number.parseFloat(getComputedStyle(panel).fontSize) / unitPixels,
    });
  }
  return pages;
}

describe("caption-words pages", () => {
  for (const [output, fontUnits] of [
    [wideOutput, 5],
    [squareOutput, 5],
    [tallOutput, 5.5],
  ] as const) {
    it(`keeps each page on one line at full size in ${output.id}`, async () => {
      const pages = await linesOfEachPage(output);

      expect(pages.length).toBeGreaterThan(10);
      expect(new Set(pages.map((page) => page.lines))).toEqual(new Set([1]));
      for (const page of pages) {
        expect(page.fontUnits).toBeCloseTo(fontUnits, 2);
      }
    });
  }
});
