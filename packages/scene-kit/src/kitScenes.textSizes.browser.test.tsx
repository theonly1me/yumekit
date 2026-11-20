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
  wideAndSquareUnits: number;
  tallUnits: number;
}[] = [
  {
    name: "title-card",
    text: "heading",
    find: (element) => element.querySelector("h1") ?? undefined,
    wideAndSquareUnits: 13,
    tallUnits: 14,
  },
  {
    name: "title-card",
    text: "subheading",
    find: (element) => element.querySelector("p") ?? undefined,
    wideAndSquareUnits: 4.5,
    tallUnits: 5,
  },
  {
    name: "quote",
    text: "sentence",
    find: (element) => element.querySelector("p") ?? undefined,
    wideAndSquareUnits: 11,
    tallUnits: 12,
  },
  {
    name: "quote",
    text: "source line",
    find: (element) => [...element.querySelectorAll("p")].at(-1),
    wideAndSquareUnits: 4.5,
    tallUnits: 5,
  },
  {
    name: "bullet-list",
    text: "heading",
    find: (element) => element.querySelector("h2") ?? undefined,
    wideAndSquareUnits: 10,
    tallUnits: 11,
  },
  {
    name: "bullet-list",
    text: "item",
    find: (element) => element.querySelector("p") ?? undefined,
    wideAndSquareUnits: 7,
    tallUnits: 7.5,
  },
  {
    name: "bar-chart",
    text: "heading",
    find: (element) => element.querySelector("h2") ?? undefined,
    wideAndSquareUnits: 10,
    tallUnits: 11,
  },
  {
    name: "bar-chart",
    text: "value",
    find: (element) => element.querySelector("span") ?? undefined,
    wideAndSquareUnits: 6.5,
    tallUnits: 7,
  },
  {
    name: "bar-chart",
    text: "label",
    find: (element) => element.querySelector("p") ?? undefined,
    wideAndSquareUnits: 4.5,
    tallUnits: 5,
  },
];

const layouts: { output: SceneOutput; isTall: boolean }[] = [
  { output: wideOutput, isTall: false },
  { output: squareOutput, isTall: false },
  { output: tallOutput, isTall: true },
];

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
    for (const { output, isTall } of layouts) {
      const units = isTall ? measured.tallUnits : measured.wideAndSquareUnits;
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
