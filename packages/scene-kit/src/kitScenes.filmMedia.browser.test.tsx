import { describe, expect, it } from "vitest";
import { boxOf } from "./testing/layoutBoxes.js";
import { pictureFramesOf, testVideo } from "./testing/filmAssets.js";
import { mountKitScene, tallOutput } from "./testing/mountKitScene.js";

const wide = testVideo({ name: "wide", widthPixels: 1920, heightPixels: 1080 });
const tall = testVideo({ name: "tall", widthPixels: 1080, heightPixels: 1920 });
const square = testVideo({
  name: "square",
  widthPixels: 1080,
  heightPixels: 1080,
});
const recording = testVideo({
  name: "recording",
  widthPixels: 2880,
  heightPixels: 1800,
  marks: [
    {
      name: "the prompt",
      region: { x: 0.2, y: 0.1, width: 0.6, height: 0.3 },
      seconds: 2,
    },
  ],
});

function pictureLayer(element: HTMLElement): DOMRect {
  const image = element.querySelector("img");
  return boxOf({ frame: element, element: image?.parentElement });
}

function windowBox(element: HTMLElement): DOMRect {
  const image = element.querySelector("img");
  return boxOf({
    frame: element,
    element: image?.closest("[aria-hidden]")?.parentElement,
  });
}

describe("the film scenes with footage", () => {
  it("keeps the three videos of shapes on the same second of their files at each frame", async () => {
    const { element, mounted } = await mountKitScene({
      name: "shapes",
      durationFrames: 120,
      beatFrames: 15,
      props: { assetIds: ["wide", "tall", "square"], startSeconds: 1 },
      assets: { wide, tall, square },
    });
    const shown: string[][] = [];
    for (const frame of [0, 14, 37, 60, 119]) {
      await mounted.seek(frame);
      shown.push(pictureFramesOf(element));
    }
    expect(shown).toEqual(
      [30, 44, 67, 90, 149].map((assetFrame) =>
        Array.from({ length: 3 }, () => String(assetFrame)),
      ),
    );
  });

  it("draws each video of shapes in the shape of its file", async () => {
    const { element, mounted } = await mountKitScene({
      name: "shapes",
      durationFrames: 120,
      props: { assetIds: ["wide", "tall", "square"] },
      assets: { wide, tall, square },
    });
    await mounted.seek(119);
    const shapes = [...element.querySelectorAll("img")].map((image) => {
      const box = boxOf({
        frame: element,
        element: image.closest("[aria-hidden]"),
      });
      return Math.round((box.width / box.height) * 100) / 100;
    });
    expect(shapes).toEqual([1.78, 0.56, 1]);
  });

  it("shows the region of a mark as large as the window, from the time of the mark", async () => {
    const { element, mounted } = await mountKitScene({
      name: "footage",
      durationFrames: 60,
      props: { assetId: "recording", mark: "the prompt", speed: 2 },
      assets: { recording },
    });
    await mounted.seek(10);
    const window = windowBox(element);
    const picture = pictureLayer(element);
    expect(pictureFramesOf(element)).toEqual(["80"]);
    expect(picture.width / window.width).toBeCloseTo(1 / 0.6, 2);
    expect(picture.left - window.left).toBeCloseTo(
      (-0.2 / 0.6) * window.width,
      0,
    );
    expect(window.width / window.height).toBeCloseTo(
      (0.6 * 2880) / (0.3 * 1800),
      2,
    );
  });

  it("moves the view of footage from the first stop to the second", async () => {
    const { element, mounted } = await mountKitScene({
      name: "footage",
      durationFrames: 90,
      beatFrames: 15,
      props: {
        assetId: "recording",
        stops: [
          { region: { x: 0, y: 0, width: 0.5, height: 0.5 } },
          { region: { x: 0.5, y: 0.5, width: 0.5, height: 0.5 }, beat: 4 },
        ],
      },
      assets: { recording },
    });
    const lefts: number[] = [];
    for (const frame of [0, 30, 60, 89]) {
      await mounted.seek(frame);
      lefts.push(
        Math.round(pictureLayer(element).left - windowBox(element).left),
      );
    }
    const settledLeft = -windowBox(element).width;
    expect(lefts[0]).toBe(0);
    expect(lefts[1]).toBe(0);
    expect(lefts[2]).toBe(Math.round(settledLeft));
    expect(lefts[3]).toBe(Math.round(settledLeft));
  });

  it("cuts look-swap to the next look on each beat and starts each look at its mark", async () => {
    const marked = testVideo({
      name: "looks",
      widthPixels: 1920,
      heightPixels: 1080,
      marks: [
        { name: "neon", seconds: 1 },
        { name: "paper", seconds: 4 },
      ],
    });
    const { element, mounted } = await mountKitScene({
      name: "look-swap",
      durationFrames: 120,
      beatFrames: 15,
      output: tallOutput,
      props: {
        assetIds: ["looks", "looks"],
        marks: ["neon", "paper"],
        labels: ["Neon", "Paper"],
      },
      assets: { looks: marked },
    });
    const seen: [string, string[]][] = [];
    for (const frame of [5, 14, 15, 20, 119]) {
      await mounted.seek(frame);
      seen.push([
        element.querySelector("[data-text-prop]")?.textContent ?? "",
        pictureFramesOf(element),
      ]);
    }
    expect(seen).toEqual([
      ["Neon", ["35"]],
      ["Neon", ["44"]],
      ["Paper", ["120"]],
      ["Paper", ["125"]],
      ["Paper", ["224"]],
    ]);
  });
});
