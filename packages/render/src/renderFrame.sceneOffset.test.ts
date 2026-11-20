import { describe, expect, it } from "vitest";
import { renderFrame } from "./index.js";
import { decodePng } from "./testing/decodePng.js";
import {
  createRenderProject,
  moduleScene,
  sceneTracks,
} from "./testing/renderProject.js";
import { movingSquareCode } from "./testing/sceneCodes.js";
import { valueOf } from "./testing/valueOf.js";

describe("renderFrame with a scene offset", () => {
  it("draws the last frame of a clip that starts the scene at sceneStartFrame", async () => {
    const folder = await createRenderProject({
      edits: [
        moduleScene({ sceneId: "square", code: movingSquareCode }),
        sceneTracks({
          tracks: [
            [
              {
                id: "late",
                sceneId: "square",
                startFrame: 0,
                durationFrames: 10,
                sceneStartFrame: 15,
              },
            ],
          ],
        }),
      ],
    });
    const rendered = valueOf(
      await renderFrame({ folder, outputId: "wide", frame: 9 }),
    );
    const picture = await decodePng(rendered.png);
    const squareLeft = (15 + 9) * 10;
    expect(picture.pixelAt({ x: squareLeft + 20, y: 90 })).toEqual([255, 0, 0]);
    expect(picture.pixelAt({ x: squareLeft - 5, y: 90 })).toEqual([0, 0, 0]);
  });
});
