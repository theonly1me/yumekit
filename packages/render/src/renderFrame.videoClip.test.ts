import type { JsonObject } from "@yumekit/project";
import { describe, expect, it } from "vitest";
import { renderFrame } from "./index.js";
import { movingMarkerVideo } from "./testing/testVideo.js";
import { valueOf } from "./testing/valueOf.js";
import {
  createVideoProject,
  markerCenterInPng,
  videoClipScene,
} from "./testing/videoProject.js";

const tallOutput = {
  id: "tall",
  label: "Tall",
  widthPixels: 90,
  heightPixels: 160,
};

const markerCenterOfSourceFrame = (sourceFrame: number) =>
  sourceFrame * 6 + 1.5;

async function markerCenterAt(options: {
  props: JsonObject;
  clipFrames: number;
  frame: number;
}): Promise<number> {
  const folder = await createVideoProject({
    video: movingMarkerVideo,
    clipFrames: options.clipFrames,
    scene: videoClipScene(options.props),
  });
  const rendered = valueOf(
    await renderFrame({ folder, outputId: "wide", frame: options.frame }),
  );
  return markerCenterInPng({ png: rendered.png });
}

async function tallMarkerCenter(props: JsonObject): Promise<number> {
  const folder = await createVideoProject({
    video: { ...movingMarkerVideo, markerX: "W*0.9-2" },
    clipFrames: 10,
    scene: videoClipScene(props),
    output: tallOutput,
  });
  const rendered = valueOf(
    await renderFrame({ folder, outputId: "tall", frame: 0 }),
  );
  return markerCenterInPng({ png: rendered.png });
}

describe("the kit scene video-clip", () => {
  it("holds the last picture when the clip is longer than the asset", async () => {
    const center = await markerCenterAt({
      props: { assetId: "clip" },
      clipFrames: 90,
      frame: 89,
    });

    expect(Math.abs(center - markerCenterOfSourceFrame(47))).toBeLessThan(2);
  });

  it("moves the first picture by startSeconds", async () => {
    const center = await markerCenterAt({
      props: { assetId: "clip", startSeconds: 0.5 },
      clipFrames: 30,
      frame: 0,
    });

    const sourceFrameAtHalfSecond = 0.5 * movingMarkerVideo.framesPerSecond;
    expect(
      Math.abs(center - markerCenterOfSourceFrame(sourceFrameAtHalfSecond)),
    ).toBeLessThan(2);
  });

  it("keeps the focus point inside a tall picture with cover", async () => {
    const scale = tallOutput.heightPixels / movingMarkerVideo.heightPixels;
    const coveredWidth = movingMarkerVideo.widthPixels * scale;
    const markerInVideo = movingMarkerVideo.widthPixels * 0.9 - 2 + 1.5;
    const expectedCenter =
      (tallOutput.widthPixels - coveredWidth) * 0.9 + markerInVideo * scale;

    const focused = await tallMarkerCenter({
      assetId: "clip",
      focus: { x: 0.9, y: 0.5 },
    });
    const centered = await tallMarkerCenter({ assetId: "clip" });

    expect(Math.abs(focused - expectedCenter)).toBeLessThan(2);
    expect(centered).toBe(-1);
  });
});
