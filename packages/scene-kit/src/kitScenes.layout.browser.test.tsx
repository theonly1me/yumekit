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
const centeredScenes = ["bullet-list", "bar-chart", "quote"] as const;

async function mountSettled(options: {
  name: (typeof centeredScenes)[number];
  output: SceneOutput;
}) {
  const { element, mounted } = await mountKitScene({
    name: options.name,
    durationFrames,
    props: typicalProps[options.name],
    output: options.output,
  });
  await mounted.seek(durationFrames - 1);
  return element;
}

function contentBlockOf(element: HTMLElement): DOMRect {
  const firstText = element.querySelector("h2, p");
  const block = firstText?.parentElement;
  if (block === null || block === undefined) {
    throw new Error("The scene shows no content block");
  }
  const frame = element.getBoundingClientRect();
  const rect = block.getBoundingClientRect();
  return new DOMRect(
    rect.left - frame.left,
    rect.top - frame.top,
    rect.width,
    rect.height,
  );
}

function sizeOf(output: SceneOutput): string {
  return `${String(output.widthPixels)} by ${String(output.heightPixels)}`;
}

describe("the content block of a kit scene", () => {
  for (const output of [wideOutput, tallOutput, squareOutput]) {
    for (const name of centeredScenes) {
      it(`centers ${name} between the top margin and the caption area in ${sizeOf(output)}`, async () => {
        const block = contentBlockOf(await mountSettled({ name, output }));
        const marginBottom = 8 * unitPixels;
        const captionAreaTop = output.heightPixels - 16 * unitPixels;
        const middle = (marginBottom + captionAreaTop) / 2;

        expect(Math.abs(block.top + block.height / 2 - middle)).toBeLessThan(1);
      });
    }
  }

  for (const name of centeredScenes) {
    it(`makes ${name} 84 units wide from the left margin in wide`, async () => {
      const block = contentBlockOf(
        await mountSettled({ name, output: wideOutput }),
      );

      expect(block.left).toBeCloseTo(8 * unitPixels, 1);
      expect(block.width).toBeCloseTo(84 * unitPixels, 1);
    });
  }

  it("keeps the content of tall between both side margins", async () => {
    const block = contentBlockOf(
      await mountSettled({ name: "bullet-list", output: tallOutput }),
    );

    expect(block.left).toBeCloseTo(8 * unitPixels, 1);
    expect(block.width).toBeCloseTo((100 - 16) * unitPixels, 1);
  });

  it("draws each bar of bar-chart 7 units tall", async () => {
    const element = await mountSettled({
      name: "bar-chart",
      output: wideOutput,
    });
    const bar =
      element.querySelector("p")?.nextElementSibling?.firstElementChild;
    if (bar === null || bar === undefined) throw new Error("No bar");

    expect(bar.getBoundingClientRect().height).toBeCloseTo(7 * unitPixels, 1);
  });

  it("draws each bullet of bullet-list at 0.45 of the item size", async () => {
    const element = await mountSettled({
      name: "bullet-list",
      output: tallOutput,
    });
    const bullet = element.querySelector('span[aria-hidden="true"]');
    if (bullet === null) throw new Error("No bullet");

    expect(bullet.getBoundingClientRect().width).toBeCloseTo(
      0.45 * 7.5 * unitPixels,
      1,
    );
  });
});
