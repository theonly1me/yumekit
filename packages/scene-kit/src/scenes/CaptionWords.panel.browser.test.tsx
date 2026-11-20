import type { SceneOutput } from "@yumekit/scene";
import { describe, expect, it } from "vitest";
import {
  mountKitScene,
  squareOutput,
  tallOutput,
  wideOutput,
} from "../testing/mountKitScene.js";

async function panelStyleOf(output: SceneOutput) {
  const { element, mounted } = await mountKitScene({
    name: "caption-words",
    durationFrames: 30,
    props: { text: "Short words" },
    output,
  });
  await mounted.seek(29);
  const panel = element.querySelector("p");
  if (panel === null) throw new Error("The caption shows no panel");
  const style = getComputedStyle(panel);
  return {
    background: style.backgroundColor,
    color: style.color,
    fontSizePixels: Number.parseFloat(style.fontSize),
  };
}

describe("caption-words panel", () => {
  it("draws paper words on an ink panel at 92 percent opacity", async () => {
    expect(await panelStyleOf(wideOutput)).toMatchObject({
      background: "rgba(24, 32, 58, 0.92)",
      color: "rgb(238, 241, 244)",
    });
  });

  it("draws words 4.5 units tall in wide and square, and 5 units in tall", async () => {
    const unitPixels = 1080 / 100;

    const sizes = [
      (await panelStyleOf(wideOutput)).fontSizePixels,
      (await panelStyleOf(squareOutput)).fontSizePixels,
      (await panelStyleOf(tallOutput)).fontSizePixels,
    ];

    expect(sizes[0]).toBeCloseTo(4.5 * unitPixels, 1);
    expect(sizes[1]).toBeCloseTo(4.5 * unitPixels, 1);
    expect(sizes[2]).toBeCloseTo(5 * unitPixels, 1);
  });
});
