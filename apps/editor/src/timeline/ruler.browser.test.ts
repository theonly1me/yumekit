import type { Page } from "playwright";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { buildCounterProject } from "../testing/counterProject.js";
import { closeBrowser, sharedBrowser } from "../testing/editorPage.js";
import { openPhonePage } from "../testing/pageWidth.js";
import { runEngine, type RunningEngine } from "../testing/runEngine.js";

let engine: RunningEngine | undefined;

function runningEngine(): RunningEngine {
  if (engine === undefined) throw new Error("The engine did not start");
  return engine;
}

beforeAll(async () => {
  engine = await runEngine();
  await buildCounterProject(engine);
});

afterAll(async () => {
  await closeBrowser();
  await engine?.remove();
});

async function makeFilmLong(lengthFrames: number): Promise<void> {
  await runningEngine().callTool({
    name: "resize_scene_clip",
    input: { clip_id: "second", duration_frames: lengthFrames - 30 },
  });
}

interface RulerLabels {
  texts: string[];
  linesOfEachLabel: number[];
  smallestGapPixels: number;
  pixelsPastTheRuler: number;
}

function rulerLabelsOf(page: Page): Promise<RulerLabels> {
  return page.getByTestId("ruler").evaluate((ruler) => {
    const rulerBox = ruler.getBoundingClientRect();
    const labels = [...ruler.querySelectorAll(".tick")];
    const boxes = labels.map((label) => label.getBoundingClientRect());
    const gaps = boxes
      .slice(1)
      .map((...[box, index]) => box.left - (boxes[index]?.right ?? 0));
    return {
      texts: labels.map((label) => label.textContent),
      linesOfEachLabel: labels.map((label) => label.getClientRects().length),
      smallestGapPixels: Math.min(...gaps),
      pixelsPastTheRuler: Math.max(
        ...boxes.map((box) => box.right - rulerBox.right),
      ),
    };
  });
}

async function openTimelineOnPhone() {
  const opened = await openPhonePage({
    browser: await sharedBrowser(),
    url: `${runningEngine().url}#edit`,
  });
  await opened.page.getByRole("switch", { name: "Detailed timeline" }).check();
  await opened.page.getByTestId("ruler").locator(".tick").first().waitFor();
  return opened;
}

describe("the ruler of the detailed timeline", () => {
  it.each([{ lengthFrames: 1200 }, { lengthFrames: 1056 }])(
    "keeps each label on one line, apart from the next, and inside the ruler at phone width for $lengthFrames frames",
    async ({ lengthFrames }) => {
      await makeFilmLong(lengthFrames);
      const { page, close } = await openTimelineOnPhone();

      const labels = await rulerLabelsOf(page);

      expect(labels.texts[0]).toBe("0 s");
      expect(labels.texts.length).toBeGreaterThanOrEqual(3);
      expect(new Set(labels.linesOfEachLabel)).toEqual(new Set([1]));
      expect(labels.smallestGapPixels).toBeGreaterThanOrEqual(12);
      expect(labels.pixelsPastTheRuler).toBeLessThanOrEqual(0);
      await close();
    },
  );
});
