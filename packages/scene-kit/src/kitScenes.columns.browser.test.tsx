import { describe, expect, it } from "vitest";
import {
  boxOf,
  middleBetweenMarginAndCaptions,
  middleOf,
  mountSettled,
  unitPixels,
} from "./testing/layoutBoxes.js";
import { wideOutput } from "./testing/mountKitScene.js";
import { longProps, typicalProps } from "./testing/sampleProps.js";

const columnScenes = ["bullet-list", "bar-chart"] as const;
const propsBySize = { typical: typicalProps, long: longProps };

async function columnsOf(options: {
  name: (typeof columnScenes)[number];
  size: keyof typeof propsBySize;
}) {
  const frame = await mountSettled({
    name: options.name,
    props: propsBySize[options.size][options.name],
    output: wideOutput,
  });
  const heading = frame.querySelector("h2");
  return {
    frame,
    heading: boxOf({ frame, element: heading }),
    content: boxOf({
      frame,
      element: heading?.parentElement?.nextElementSibling,
    }),
  };
}

describe("two columns in wide", () => {
  for (const name of columnScenes) {
    for (const size of ["typical", "long"] as const) {
      it(`puts the ${size} heading of ${name} left of a content column that starts at 78 units`, async () => {
        const { heading, content } = await columnsOf({ name, size });

        expect(heading.left).toBeCloseTo(8 * unitPixels, 1);
        expect(heading.right).toBeLessThanOrEqual(70 * unitPixels + 1);
        expect(heading.right).toBeLessThanOrEqual(content.left);
        expect(content.left).toBeCloseTo(78 * unitPixels, 1);
        expect(content.right).toBeCloseTo(1920 - 8 * unitPixels, 1);
      });
    }

    it(`centers the heading and the content of ${name} on one line`, async () => {
      const { heading, content } = await columnsOf({ name, size: "typical" });
      const middle = middleBetweenMarginAndCaptions(wideOutput);

      expect(Math.abs(middleOf(heading) - middle)).toBeLessThan(1);
      expect(Math.abs(middleOf(content) - middle)).toBeLessThan(1);
    });
  }

  it("fills 80 percent of the content column with the longest bar", async () => {
    const { frame, content } = await columnsOf({
      name: "bar-chart",
      size: "typical",
    });
    const longestBar = boxOf({
      frame,
      element: frame.querySelector("p")?.nextElementSibling?.firstElementChild,
    });

    expect(longestBar.width).toBeCloseTo(0.8 * content.width, 1);
  });
});
