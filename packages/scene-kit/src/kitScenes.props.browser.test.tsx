import type { JsonObject } from "@yumekit/scene";
import { afterEach, describe, expect, it, vi } from "vitest";
import { rectsOutside, shownTexts } from "./testing/contentBoxes.js";
import { mountKitScene, tallOutput } from "./testing/mountKitScene.js";
import { kitSceneNames, typicalProps } from "./testing/sampleProps.js";

const badProps: JsonObject = {
  heading: 42,
  subheading: ["no"],
  items: "not a list",
  assetId: { id: "photo" },
  caption: false,
  direction: "sideways",
  text: 7,
  bars: [{ label: 3 }, null],
  valuePrefix: 9,
  quote: null,
  source: 5,
  accentWord: 3,
  kicker: ["no"],
  value: "many",
  prefix: 1,
  suffix: 2,
  label: 4,
  left: 1,
  right: 2,
  rows: "none",
  steps: ["only one"],
  request: 5,
  answer: null,
  names: "both",
  frame: "tablet",
  body: 3,
  side: "up",
  name: 9,
  tagline: 7,
  action: 2,
  handle: 3,
  role: 4,
  lines: "one line",
};

const defaultTextsByScene: Record<(typeof kitSceneNames)[number], string[]> = {
  "title-card": ["Title"],
  "bullet-list": ["Point"],
  "image-pan": [],
  "caption-words": [],
  "bar-chart": ["Value", "1"],
  quote: ["Quote"],
  "video-clip": [],
  hero: ["Title"],
  stat: ["0"],
  compare: ["Before", "After"],
  steps: ["1", "Start", "2", "Finish"],
  chat: ["Question", "Answer"],
  device: [],
  split: ["Title"],
  "logo-reveal": ["N", "Name"],
  checklist: ["Point"],
  "end-card": ["Title"],
  "lower-third": ["Name"],
  kinetic: ["Line"],
};

afterEach(() => {
  vi.restoreAllMocks();
});

describe("kit scene props", () => {
  for (const name of kitSceneNames) {
    it(`draws the defaults of ${name} for wrong props and logs no error`, async () => {
      const consoleError = vi.spyOn(console, "error");
      const { element, mounted } = await mountKitScene({
        name,
        durationFrames: 60,
        props: badProps,
      });
      await mounted.seek(59);
      expect(shownTexts(element)).toEqual(defaultTextsByScene[name]);
      expect(consoleError).not.toHaveBeenCalled();
    });

    it(`draws the settled picture of ${name} in a clip of 1 frame`, async () => {
      const consoleError = vi.spyOn(console, "error");
      const settled = await mountKitScene({
        name,
        durationFrames: 300,
        props: typicalProps[name],
        output: tallOutput,
      });
      await settled.mounted.seek(299);
      const { element, mounted } = await mountKitScene({
        name,
        durationFrames: 1,
        props: typicalProps[name],
        output: tallOutput,
      });
      await mounted.seek(0);
      expect(shownTexts(element)).toEqual(shownTexts(settled.element));
      expect(rectsOutside(element)).toEqual([]);
      expect(consoleError).not.toHaveBeenCalled();
    });
  }

  it("keeps the valid items of a list and drops the wrong ones", async () => {
    const { element, mounted } = await mountKitScene({
      name: "bullet-list",
      durationFrames: 300,
      props: { items: ["First", 2, "", "Third", "4", "5", "6", "7", "8"] },
    });
    await mounted.seek(299);
    expect(shownTexts(element)).toEqual(["First", "Third", "4", "5", "6", "7"]);
  });
});
