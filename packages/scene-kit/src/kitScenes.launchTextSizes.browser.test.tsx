import type { SceneOutput } from "@yumekit/scene";
import { describe, expect, it } from "vitest";
import {
  mountKitScene,
  tallOutput,
  wideOutput,
} from "./testing/mountKitScene.js";
import { testImageAsset, typicalProps } from "./testing/sampleProps.js";
import type { launchSceneNames } from "./testing/launchSceneProps.js";

const unitPixels = 1080 / 100;
const durationFrames = 150;

type LaunchSceneName = (typeof launchSceneNames)[number];

type Units = Record<"wide" | "tall", number>;

const measuredTexts: {
  name: LaunchSceneName;
  textProp: string;
  units: Units;
}[] = [
  {
    name: "hero",
    textProp: "heading",
    units: { wide: 18, tall: 16.8 },
  },
  {
    name: "hero",
    textProp: "kicker",
    units: { wide: 5.5, tall: 5.5 },
  },
  { name: "stat", textProp: "label", units: { wide: 8, tall: 8 } },
  {
    name: "compare",
    textProp: "right",
    units: { wide: 9.2, tall: 8 },
  },
  {
    name: "compare",
    textProp: "rows.0.left",
    units: { wide: 7.2, tall: 6.56 },
  },
  {
    name: "steps",
    textProp: "heading",
    units: { wide: 12, tall: 12 },
  },
  {
    name: "steps",
    textProp: "steps.0",
    units: { wide: 7.2, tall: 8.4 },
  },
  {
    name: "chat",
    textProp: "answer",
    units: { wide: 7.2, tall: 7.6 },
  },
  {
    name: "device",
    textProp: "caption",
    units: { wide: 10.8, tall: 9.6 },
  },
  {
    name: "split",
    textProp: "heading",
    units: { wide: 12, tall: 12 },
  },
  {
    name: "split",
    textProp: "body",
    units: { wide: 6.4, tall: 6.4 },
  },
  {
    name: "logo-reveal",
    textProp: "name",
    units: { wide: 17.25, tall: 16.1 },
  },
  {
    name: "checklist",
    textProp: "items.0",
    units: { wide: 8, tall: 8 },
  },
  {
    name: "end-card",
    textProp: "heading",
    units: { wide: 16.5, tall: 15.4 },
  },
  {
    name: "lower-third",
    textProp: "name",
    units: { wide: 8, tall: 8 },
  },
  {
    name: "lower-third",
    textProp: "role",
    units: { wide: 5.5, tall: 5.5 },
  },
  {
    name: "kinetic",
    textProp: "lines.1",
    units: { wide: 24, tall: 20 },
  },
];

const numberUnits: Units = { wide: 46, tall: 42 };

const layouts = [
  { output: wideOutput, layout: "wide" },
  { output: tallOutput, layout: "tall" },
] as const;

async function settledScene(options: {
  name: LaunchSceneName;
  output: SceneOutput;
}) {
  const { element, mounted } = await mountKitScene({
    name: options.name,
    durationFrames,
    props: typicalProps[options.name],
    output: options.output,
    assets: { photo: await testImageAsset() },
  });
  await mounted.seek(durationFrames - 1);
  return element;
}

function fontUnitsOf(element: Element | null): number {
  if (element === null) throw new Error("The scene does not show the text");
  return Number.parseFloat(getComputedStyle(element).fontSize) / unitPixels;
}

describe("text sizes of the launch scenes", () => {
  for (const measured of measuredTexts) {
    for (const { output, layout } of layouts) {
      const units = measured.units[layout];
      it(`draws ${measured.textProp} of ${measured.name} ${String(units)} units tall in ${output.id}`, async () => {
        const element = await settledScene({ name: measured.name, output });
        const text = element.querySelector(
          `[data-text-prop="${measured.textProp}"]`,
        );
        expect(fontUnitsOf(text)).toBeCloseTo(units, 2);
      });
    }
  }

  for (const { output, layout } of layouts) {
    it(`draws the number of stat ${String(numberUnits[layout])} units tall in ${output.id}`, async () => {
      const element = await settledScene({ name: "stat", output });
      const number = [...element.querySelectorAll("p")].find(
        (paragraph) => paragraph.textContent === "98%",
      );
      expect(fontUnitsOf(number ?? null)).toBeCloseTo(numberUnits[layout], 2);
    });
  }
});
