import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { openProject } from "@yumekit/project";
import { describe, expect, it } from "vitest";
import { z } from "zod";
import { renderFrame } from "./index.js";
import { moduleScene } from "./testing/renderProject.js";
import {
  markerStepPixels,
  markerWidthPixels,
  movingMarkerVideo,
} from "./testing/testVideo.js";
import { failureOf, valueOf } from "./testing/valueOf.js";
import {
  createVideoProject,
  markerCenterInPng,
  videoFrameCode,
} from "./testing/videoProject.js";

const completeSchema = z.strictObject({ pictureCount: z.int() });
const projectFramesPerSecond = 30;
const durationFrames = movingMarkerVideo.seconds * projectFramesPerSecond;

function sourceFrameOf(assetFrame: number): number {
  return Math.floor(
    (assetFrame * movingMarkerVideo.framesPerSecond) / projectFramesPerSecond,
  );
}

function markerCenterOfSourceFrame(sourceFrame: number): number {
  return sourceFrame * markerStepPixels + (markerWidthPixels - 1) / 2;
}

async function completeFileOf(folder: string): Promise<unknown> {
  const opened = await openProject({ folder });
  const [asset] = opened.ok ? opened.value.read().assets : [];
  if (asset === undefined) {
    throw new Error("The project has no asset");
  }
  const cacheFolder = `${asset.contentHash.replace("sha256:", "sha256-")}-${String(projectFramesPerSecond)}`;
  expect(cacheFolder).toMatch(/^sha256-[0-9a-f]{64}-30$/);
  return JSON.parse(
    await readFile(
      join(folder, ".cache", "video-frames", cacheFolder, "complete.json"),
      "utf8",
    ),
  );
}

describe("renderFrame with a video asset", () => {
  it("makes one picture for each project frame of a 24 frames per second video", async () => {
    const folder = await createVideoProject({
      video: movingMarkerVideo,
      clipFrames: durationFrames,
    });

    valueOf(await renderFrame({ folder, outputId: "wide", frame: 0 }));

    const { pictureCount } = completeSchema.parse(await completeFileOf(folder));
    expect(Math.abs(pictureCount - durationFrames)).toBeLessThanOrEqual(1);
  });

  it("draws the source frame of frame 0, frame 15, and the last frame with VideoFrame", async () => {
    const folder = await createVideoProject({
      video: movingMarkerVideo,
      clipFrames: durationFrames,
    });
    const frames = [0, 15, durationFrames - 1];

    const centers: number[] = [];
    for (const frame of frames) {
      const rendered = valueOf(
        await renderFrame({ folder, outputId: "wide", frame }),
      );
      centers.push(await markerCenterInPng({ png: rendered.png }));
    }

    const expected = frames.map((frame) =>
      markerCenterOfSourceFrame(sourceFrameOf(frame)),
    );
    expect(expected).toEqual([1.5, 73.5, 283.5]);
    for (const [index, center] of centers.entries()) {
      expect(Math.abs(center - (expected[index] ?? -100))).toBeLessThan(2);
    }
  });

  it("returns scene-error that names the asset when VideoFrame gets an asset that is not a video", async () => {
    const folder = await createVideoProject({
      video: movingMarkerVideo,
      clipFrames: 10,
      scene: moduleScene({
        sceneId: "shot",
        code: videoFrameCode,
        props: { assetId: "missing" },
      }),
    });

    const failure = failureOf(
      await renderFrame({ folder, outputId: "wide", frame: 0 }),
    );

    expect(failure).toMatchObject({ kind: "scene-error", sceneId: "shot" });
    expect(failure.message).toContain('"missing"');
  });
});
