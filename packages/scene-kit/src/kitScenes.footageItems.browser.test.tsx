import type { SceneOutput } from "@yumekit/scene";
import { describe, expect, it } from "vitest";
import { rectsOutside, shownTexts } from "./testing/contentBoxes.js";
import { testVideo } from "./testing/filmAssets.js";
import { boxOf } from "./testing/layoutBoxes.js";
import {
  mountKitScene,
  tallOutput,
  wideOutput,
} from "./testing/mountKitScene.js";

const recording = testVideo({
  name: "steps",
  widthPixels: 2880,
  heightPixels: 1800,
});
const names = ["Claude Code", "Codex", "Cursor"];

async function mountSteps(output: SceneOutput) {
  return mountKitScene({
    name: "footage",
    durationFrames: 120,
    beatFrames: 15,
    output,
    assets: { steps: recording },
    props: {
      heading: "Your own AI does the work.",
      assetId: "steps",
      region: { x: 0.07, y: 0.23, width: 0.3, height: 0.55 },
      items: names,
    },
  });
}

function boxes(element: HTMLElement) {
  const window = element
    .querySelector("img")
    ?.closest("[aria-hidden]")?.parentElement;
  return {
    window: boxOf({ frame: element, element: window }),
    first: boxOf({
      frame: element,
      element: element.querySelector('[data-text-prop="items.0"]'),
    }),
    last: boxOf({
      frame: element,
      element: element.querySelector('[data-text-prop="items.2"]'),
    }),
  };
}

describe("footage with lines beside it", () => {
  it("brings in one line on each beat after the window", async () => {
    const { element, mounted } = await mountSteps(wideOutput);

    await mounted.seek(40);
    const early = shownTexts(element);
    await mounted.seek(119);
    const settled = shownTexts(element);

    expect(early).toContain("Claude Code");
    expect(early).not.toContain("Cursor");
    expect(settled).toEqual(
      expect.arrayContaining(["Your own AI does the work.", ...names]),
    );
  });

  it("puts the lines beside the window in wide, and under it in tall, inside the picture", async () => {
    const wide = await mountSteps(wideOutput);
    await wide.mounted.seek(119);
    const tall = await mountSteps(tallOutput);
    await tall.mounted.seek(119);

    const wideBoxes = boxes(wide.element);
    const tallBoxes = boxes(tall.element);

    expect(wideBoxes.first.left).toBeGreaterThan(
      wideBoxes.window.left + wideBoxes.window.width,
    );
    expect(tallBoxes.first.top).toBeGreaterThan(
      tallBoxes.window.top + tallBoxes.window.height,
    );
    expect(tallBoxes.last.top).toBeGreaterThan(tallBoxes.first.top);
    expect(rectsOutside(wide.element)).toEqual([]);
    expect(rectsOutside(tall.element)).toEqual([]);
  });
});
