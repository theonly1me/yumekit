import { describe, expect, it } from "vitest";
import { renderFrame } from "./index.js";
import { moduleScene } from "./testing/renderProject.js";
import { movingMarkerVideo } from "./testing/testVideo.js";
import { failureOf, valueOf } from "./testing/valueOf.js";
import {
  createVideoProject,
  markerCenterInPng,
} from "./testing/videoProject.js";

const unknownAssetPictureCode = `import { defineReactScene } from "@yumekit/scene";

export default defineReactScene(() => (
  <img src="/asset-frames/unknown/0.jpg" alt="" />
));
`;

const lastSourceFrame =
  movingMarkerVideo.seconds * movingMarkerVideo.framesPerSecond - 1;

describe("frame pictures of a video with fewer pictures than its record", () => {
  it("draws the last source picture for a frame past the last picture", async () => {
    const recordedFrames = movingMarkerVideo.seconds * 30 + 2;
    const folder = await createVideoProject({
      video: { ...movingMarkerVideo, extraRecordedFrames: 2 },
      clipFrames: recordedFrames,
    });

    const rendered = valueOf(
      await renderFrame({
        folder,
        outputId: "wide",
        frame: recordedFrames - 1,
      }),
    );

    const center = await markerCenterInPng({ png: rendered.png });
    expect(Math.abs(center - (lastSourceFrame * 6 + 1.5))).toBeLessThan(2);
  });

  it("gives no picture for an asset id that is not a video asset of the project", async () => {
    const folder = await createVideoProject({
      video: movingMarkerVideo,
      clipFrames: 5,
      scene: moduleScene({ sceneId: "shot", code: unknownAssetPictureCode }),
    });

    const failure = failureOf(
      await renderFrame({ folder, outputId: "wide", frame: 0 }),
    );

    expect(failure).toMatchObject({ kind: "scene-error", sceneId: "shot" });
    expect(failure.message).toContain("did not decode");
  });
});
