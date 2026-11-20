import { describe, expect, it } from "vitest";
import {
  boxOf,
  middleBetweenMarginAndCaptions,
  middleOf,
  mountSettled,
  unitPixels,
} from "./testing/layoutBoxes.js";
import {
  squareOutput,
  tallOutput,
  wideOutput,
} from "./testing/mountKitScene.js";
import { longProps, typicalProps } from "./testing/sampleProps.js";

const stackedScenes = ["bullet-list", "bar-chart", "quote"] as const;
const propsThatFitCentered = {
  ...typicalProps,
  "bar-chart": { ...typicalProps["bar-chart"], heading: "Ten minutes" },
};

describe("one column in tall and square", () => {
  for (const output of [tallOutput, squareOutput]) {
    for (const name of stackedScenes) {
      it(`centers ${name} between the top margin and the caption area in ${output.id}`, async () => {
        const frame = await mountSettled({
          name,
          props: propsThatFitCentered[name],
          output,
        });
        const block = boxOf({
          frame,
          element: frame.querySelector("h2, p")?.parentElement,
        });

        expect(
          Math.abs(middleOf(block) - middleBetweenMarginAndCaptions(output)),
        ).toBeLessThan(1);
        expect(block.left).toBeCloseTo(8 * unitPixels, 1);
        expect(block.width).toBeCloseTo((100 - 16) * unitPixels, 1);
      });
    }
  }

  it("draws each bar of bar-chart 8 units tall", async () => {
    const frame = await mountSettled({
      name: "bar-chart",
      props: typicalProps["bar-chart"],
      output: tallOutput,
    });
    const bar = boxOf({
      frame,
      element: frame.querySelector("p")?.nextElementSibling?.firstElementChild,
    });

    expect(bar.height).toBeCloseTo(8 * unitPixels, 1);
  });

  it("draws bullets at 0.45 and spaces items at 0.55 of the item size", async () => {
    const frame = await mountSettled({
      name: "bullet-list",
      props: typicalProps["bullet-list"],
      output: tallOutput,
    });
    const [first, second] = [...frame.querySelectorAll("p")].map(
      (item) => item.parentElement,
    );
    const bullet = boxOf({
      frame,
      element: frame.querySelector('span[aria-hidden="true"]'),
    });
    const gap =
      boxOf({ frame, element: second }).top -
      boxOf({ frame, element: first }).bottom;

    expect(bullet.width).toBeCloseTo(0.45 * 8 * unitPixels, 1);
    expect(gap).toBeCloseTo(0.55 * 8 * unitPixels, 1);
  });
});

describe("wide quote and title-card", () => {
  it("centers the quote and keeps it up to 130 units wide", async () => {
    const frame = await mountSettled({
      name: "quote",
      props: longProps.quote,
      output: wideOutput,
    });
    const block = boxOf({
      frame,
      element: frame.querySelector("p")?.parentElement,
    });

    expect(
      Math.abs(middleOf(block) - middleBetweenMarginAndCaptions(wideOutput)),
    ).toBeLessThan(1);
    expect(block.left).toBeCloseTo(8 * unitPixels, 1);
    expect(block.width).toBeCloseTo(130 * unitPixels, 1);
  });

  it("keeps the title-card heading up to 120 units wide", async () => {
    const frame = await mountSettled({
      name: "title-card",
      props: longProps["title-card"],
      output: wideOutput,
    });
    const heading = boxOf({ frame, element: frame.querySelector("h1") });

    expect(heading.left).toBeCloseTo(8 * unitPixels, 1);
    expect(heading.width).toBeCloseTo(120 * unitPixels, 1);
  });
});
