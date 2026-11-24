import type { JsonObject, SceneOutput } from "@yumekit/scene";
import { describe, expect, it } from "vitest";
import { shownTexts } from "./testing/contentBoxes.js";
import { boxOf, unitPixels } from "./testing/layoutBoxes.js";
import { testVideo } from "./testing/filmAssets.js";
import {
  mountKitScene,
  tallOutput,
  wideOutput,
} from "./testing/mountKitScene.js";

const clip = testVideo({ name: "clip", widthPixels: 1920, heightPixels: 1080 });
const heading = "One idea.";
const headedScenes = {
  footage: { heading, assetId: "clip" },
  wall: { heading, assetIds: ["clip", "clip", "clip", "clip"] },
  shapes: { heading, assetIds: ["clip", "clip"] },
  "look-swap": {
    heading,
    assetIds: ["clip", "clip"],
    labels: ["Midnight", "Neon"],
  },
  counts: { heading, items: [{ value: 5, label: "looks" }] },
};
const headingUnits = { wide: 9.6, tall: 8.8 };
const margins = { wide: 13, tall: 8 };

async function settledBoxes(options: {
  name: string;
  output: SceneOutput;
  props: JsonObject;
}) {
  const { element, mounted } = await mountKitScene({
    name: options.name,
    durationFrames: 120,
    props: options.props,
    output: options.output,
    assets: { clip },
  });
  await mounted.seek(119);
  const headingBox = boxOf({
    frame: element,
    element: element.querySelector('[data-text-prop="heading"]'),
  });
  const fontSize = Number.parseFloat(
    getComputedStyle(
      element.querySelector('[data-text-prop="heading"]') ?? element,
    ).fontSize,
  );
  const media = element
    .querySelector("img")
    ?.closest("[aria-hidden]")?.parentElement;
  return {
    headingBox,
    fontSize,
    media:
      media === undefined || media === null
        ? undefined
        : boxOf({ frame: element, element: media }),
  };
}

describe("one layout grid for the film scenes", () => {
  for (const [layout, output] of [
    ["wide", wideOutput],
    ["tall", tallOutput],
  ] as const) {
    it(`puts the heading of each film scene in one place and size in ${layout}`, async () => {
      const found = [];
      for (const [name, props] of Object.entries(headedScenes)) {
        const boxes = await settledBoxes({ name, output, props });
        found.push({
          left: Math.round(boxes.headingBox.left),
          top: Math.round(boxes.headingBox.top),
          fontSize: boxes.fontSize,
        });
      }
      const [first] = found;
      expect(found).toEqual(Array(found.length).fill(first));
      expect(first?.fontSize).toBeCloseTo(headingUnits[layout] * unitPixels, 1);
    });

    it(`gives footage and look-swap one window, and wall and shapes one start, in ${layout}`, async () => {
      const placeOf = async (name: keyof typeof headedScenes) => {
        const { media } = await settledBoxes({
          name,
          output,
          props: headedScenes[name],
        });
        return media === undefined
          ? []
          : [media.left, media.top, media.width, media.height].map(Math.round);
      };
      const footage = await placeOf("footage");
      const lookSwap = await placeOf("look-swap");
      const wall = await placeOf("wall");
      const shapes = await placeOf("shapes");

      expect(lookSwap).toEqual(footage);
      expect(shapes.slice(0, 2)).toEqual(wall.slice(0, 2));
      expect(wall[0]).toBe(Math.round(margins[layout] * unitPixels));
    });
  }
});

describe("the film scenes without footage", () => {
  it("brings in one line on each beat and dims the lines before it", async () => {
    const { element, mounted } = await mountKitScene({
      name: "lines",
      durationFrames: 120,
      beatFrames: 15,
      props: {
        lines: ["On your computer.", "No account.", "Open source."],
        accentLine: 3,
      },
    });
    const shown: string[][] = [];
    for (const frame of [14, 29, 119]) {
      await mounted.seek(frame);
      shown.push(shownTexts(element));
    }
    expect(shown).toEqual([
      ["On your computer."],
      ["No account."],
      ["Open source."],
    ]);
  });

  it("types the command of command letter by letter", async () => {
    const { element, mounted } = await mountKitScene({
      name: "command",
      durationFrames: 150,
      beatFrames: 15,
      props: { heading: "yumekit", command: "npm install -g yumekit" },
    });
    const typedAt = async (frame: number) => {
      await mounted.seek(frame);
      return (
        element.querySelector('[data-text-prop="command"]')?.textContent ?? ""
      );
    };
    expect(await typedAt(22)).toBe("");
    expect(await typedAt(32)).toBe("npm insta");
    expect(await typedAt(149)).toBe("npm install -g yumekit");
  });

  it("paints the flat background of midnight and neon, and keeps the grain of editorial", async () => {
    const backdrops: Record<string, string> = {};
    for (const look of ["midnight", "neon", "editorial"]) {
      const { element, mounted } = await mountKitScene({
        name: "lines",
        durationFrames: 30,
        props: { lines: ["Open source."] },
        look,
      });
      await mounted.seek(29);
      backdrops[look] =
        element
          .querySelector("[data-backdrop]")
          ?.getAttribute("data-backdrop") ?? "";
    }
    expect(backdrops).toEqual({
      midnight: "flat",
      neon: "flat",
      editorial: "grain",
    });
  });
});
