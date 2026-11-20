import type { SceneOutput } from "@yumekit/scene";
import { describe, expect, it } from "vitest";
import {
  mountKitScene,
  squareOutput,
  tallOutput,
  wideOutput,
} from "./testing/mountKitScene.js";
import { typicalProps } from "./testing/sampleProps.js";

const unitPixels = 1080 / 100;
const durationFrames = 150;

type MeasuredScene = "title-card" | "bullet-list" | "bar-chart" | "quote";

const measuredTexts: {
  name: MeasuredScene;
  text: string;
  find: (element: HTMLElement) => Element | undefined;
  units: Record<"wide" | "square" | "tall", number>;
}[] = [
  {
    name: "title-card",
    text: "heading",
    find: (element) => element.querySelector("h1") ?? undefined,
    units: { wide: 15, square: 13, tall: 14 },
  },
  {
    name: "title-card",
    text: "subheading",
    find: (element) => element.querySelector("p") ?? undefined,
    units: { wide: 5.5, square: 5, tall: 5.5 },
  },
  {
    name: "quote",
    text: "sentence",
    find: (element) => element.querySelector("p") ?? undefined,
    units: { wide: 13, square: 12, tall: 12.5 },
  },
  {
    name: "quote",
    text: "source line",
    find: (element) => [...element.querySelectorAll("p")].at(-1),
    units: { wide: 5.5, square: 5, tall: 5.5 },
  },
  {
    name: "bullet-list",
    text: "heading",
    find: (element) => element.querySelector("h2") ?? undefined,
    units: { wide: 12, square: 11, tall: 12 },
  },
  {
    name: "bullet-list",
    text: "item",
    find: (element) => element.querySelector("p") ?? undefined,
    units: { wide: 8, square: 7.5, tall: 8 },
  },
  {
    name: "bar-chart",
    text: "heading",
    find: (element) => element.querySelector("h2") ?? undefined,
    units: { wide: 12, square: 11, tall: 12 },
  },
  {
    name: "bar-chart",
    text: "value",
    find: (element) => element.querySelector("span") ?? undefined,
    units: { wide: 7.5, square: 7, tall: 7.5 },
  },
  {
    name: "bar-chart",
    text: "label",
    find: (element) => element.querySelector("p") ?? undefined,
    units: { wide: 5.5, square: 5, tall: 5.5 },
  },
];

const layouts = [
  { output: wideOutput, layout: "wide" },
  { output: squareOutput, layout: "square" },
  { output: tallOutput, layout: "tall" },
] as const;

async function fontSizeUnitsOf(options: {
  name: MeasuredScene;
  output: SceneOutput;
  find: (element: HTMLElement) => Element | undefined;
}): Promise<number> {
  const { element, mounted } = await mountKitScene({
    name: options.name,
    durationFrames,
    props: typicalProps[options.name],
    output: options.output,
  });
  await mounted.seek(durationFrames - 1);
  const text = options.find(element);
  if (text === undefined) throw new Error(`${options.name} shows no text`);
  return Number.parseFloat(getComputedStyle(text).fontSize) / unitPixels;
}

describe("kit text sizes of the paper style pack", () => {
  for (const measured of measuredTexts) {
    for (const { output, layout } of layouts) {
      const units = measured.units[layout];
      it(`draws the ${measured.text} of ${measured.name} ${String(units)} units tall in ${output.id}`, async () => {
        expect(
          await fontSizeUnitsOf({
            name: measured.name,
            output,
            find: measured.find,
          }),
        ).toBeCloseTo(units, 2);
      });
    }
  }
});
