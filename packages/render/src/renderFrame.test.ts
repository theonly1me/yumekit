import { describe, expect, it } from "vitest";
import { renderFrame } from "./index.js";
import { decodePng } from "./testing/decodePng.js";
import { movingSquareCode } from "./testing/sceneCodes.js";
import { valueOf } from "./testing/valueOf.js";
import {
  createRenderProject,
  moduleScene,
  sceneTracks,
} from "./testing/renderProject.js";

const red: [number, number, number] = [255, 0, 0];
const black: [number, number, number] = [0, 0, 0];

function squareProject() {
  return createRenderProject({
    edits: [
      moduleScene({ sceneId: "square", code: movingSquareCode }),
      sceneTracks({
        tracks: [
          [
            {
              id: "move",
              sceneId: "square",
              startFrame: 0,
              durationFrames: 30,
            },
          ],
        ],
      }),
    ],
  });
}

describe("renderFrame", () => {
  it("draws the square where the frame puts it", async () => {
    const folder = await squareProject();
    for (const frame of [0, 7, 20]) {
      const rendered = valueOf(
        await renderFrame({ folder, outputId: "wide", frame }),
      );
      const picture = await decodePng(rendered.png);
      const squareLeft = frame * 10;
      expect(picture.pixelAt({ x: squareLeft + 20, y: 90 })).toEqual(red);
      expect(picture.pixelAt({ x: squareLeft + 45, y: 90 })).toEqual(black);
      expect(picture.pixelAt({ x: squareLeft + 20, y: 60 })).toEqual(black);
    }
  });
});

describe("renderFrame repeats", () => {
  it("gives identical bytes for the same frame rendered two times", async () => {
    const folder = await squareProject();
    const first = valueOf(
      await renderFrame({ folder, outputId: "wide", frame: 12 }),
    );
    const second = valueOf(
      await renderFrame({ folder, outputId: "wide", frame: 12 }),
    );
    expect(Buffer.from(second.png).equals(first.png)).toBe(true);
  });

  it("keeps the layout and changes only the pixel density at scale 0.25", async () => {
    const folder = await createRenderProject({
      outputs: [
        { id: "wide", label: "Wide", widthPixels: 1920, heightPixels: 1080 },
      ],
      edits: [
        moduleScene({ sceneId: "square", code: movingSquareCode }),
        sceneTracks({
          tracks: [
            [
              {
                id: "move",
                sceneId: "square",
                startFrame: 0,
                durationFrames: 30,
              },
            ],
          ],
        }),
      ],
    });
    const rendered = valueOf(
      await renderFrame({ folder, outputId: "wide", frame: 20, scale: 0.25 }),
    );
    expect(rendered).toMatchObject({ widthPixels: 480, heightPixels: 270 });
    const picture = await decodePng(rendered.png);
    expect(picture.pixelAt({ x: (20 * 10 + 20) / 4, y: 540 / 4 })).toEqual(red);
  });
});
