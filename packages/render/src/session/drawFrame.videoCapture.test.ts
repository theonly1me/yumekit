import type { Edit } from "@yumekit/project";
import { describe, expect, it } from "vitest";
import { loadOutput } from "../project/loadOutput.js";
import type { RenderScale } from "../renderFailure.js";
import { rgbPixelsOf } from "../testing/decodePng.js";
import { movingSquareCode } from "../testing/sceneCodes.js";
import {
  createRenderProject,
  moduleScene,
  sceneTracks,
} from "../testing/renderProject.js";
import { valueOf } from "../testing/valueOf.js";
import { drawFrame } from "./drawFrame.js";
import { withStagePage } from "./withStagePage.js";

const glowTitle: Edit = {
  kind: "putScene",
  scene: {
    id: "title",
    title: "Title",
    notes: "",
    source: {
      kind: "kit",
      component: "title-card",
      props: { heading: "Glow" },
    },
  },
};

async function samePixelsOfBothCaptures(
  scale: RenderScale,
): Promise<boolean[]> {
  const folder = await createRenderProject({
    edits: [
      glowTitle,
      moduleScene({ sceneId: "square", code: movingSquareCode }),
      { kind: "setLook", look: "midnight" },
      sceneTracks({
        tracks: [
          [
            {
              id: "title",
              sceneId: "title",
              startFrame: 0,
              durationFrames: 30,
            },
            {
              id: "square",
              sceneId: "square",
              startFrame: 30,
              durationFrames: 20,
            },
          ],
        ],
      }),
    ],
  });
  const loaded = valueOf(await loadOutput({ folder, outputId: "wide" }));
  return valueOf(
    await withStagePage({
      loaded,
      scale,
      use: async (stagePage) => {
        const same: boolean[] = [];
        for (const frame of [5, 25, 40]) {
          const still = valueOf(
            await drawFrame({ stagePage, frame, use: "still" }),
          );
          const video = await stagePage.screenshot("video");
          const [stillPixels, videoPixels] = await Promise.all([
            rgbPixelsOf(still),
            rgbPixelsOf(video),
          ]);
          same.push(stillPixels.length > 0 && stillPixels.equals(videoPixels));
        }
        return { ok: true, value: same };
      },
    }),
  );
}

describe("the capture of a video frame", () => {
  it("decodes to the pixels of the still picture at full size", async () => {
    expect(await samePixelsOfBothCaptures(1)).toEqual([true, true, true]);
  });

  it("decodes to the pixels of the still picture at half size", async () => {
    expect(await samePixelsOfBothCaptures(0.5)).toEqual([true, true, true]);
  });

  it("decodes to the pixels of the still picture at a quarter size", async () => {
    expect(await samePixelsOfBothCaptures(0.25)).toEqual([true, true, true]);
  });
});
