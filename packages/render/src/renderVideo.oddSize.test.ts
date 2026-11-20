import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { renderFrame, renderVideo } from "./index.js";
import { probeVideo } from "./testing/probe.js";
import {
  createRenderProject,
  moduleScene,
  sceneTracks,
  temporaryFolder,
} from "./testing/renderProject.js";
import { solidColorCode } from "./testing/sceneCodes.js";
import { valueOf } from "./testing/valueOf.js";

function portraitProject(heightPixels: number) {
  return createRenderProject({
    outputs: [
      { id: "wide", label: "Portrait", widthPixels: 1080, heightPixels },
    ],
    edits: [
      moduleScene({ sceneId: "solid", code: solidColorCode }),
      sceneTracks({
        tracks: [
          [{ id: "show", sceneId: "solid", startFrame: 0, durationFrames: 6 }],
        ],
      }),
    ],
  });
}

describe("renderVideo at scale 0.25 for a portrait output", () => {
  it.each([
    { heightPixels: 1350, frameHeight: 338, videoHeight: 338 },
    { heightPixels: 1340, frameHeight: 335, videoHeight: 334 },
  ])(
    "renders 1080 by $heightPixels as a $frameHeight pixel frame and a $videoHeight pixel video",
    async ({ heightPixels, frameHeight, videoHeight }) => {
      const folder = await portraitProject(heightPixels);
      const frame = valueOf(
        await renderFrame({ folder, outputId: "wide", frame: 0, scale: 0.25 }),
      );
      expect(frame).toMatchObject({
        widthPixels: 270,
        heightPixels: frameHeight,
      });
      const destination = join(
        await temporaryFolder(),
        "not",
        "yet",
        "portrait.mp4",
      );
      const video = valueOf(
        await renderVideo({
          folder,
          outputId: "wide",
          destination,
          scale: 0.25,
        }),
      );
      expect(video).toMatchObject({
        file: destination,
        widthPixels: 270,
        heightPixels: videoHeight,
      });
      expect(await probeVideo(destination)).toMatchObject([
        {
          codec_type: "video",
          width: 270,
          height: videoHeight,
          nb_read_frames: "6",
        },
      ]);
    },
  );
});
