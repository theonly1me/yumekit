import { readdir, rm, stat, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { renderFrame } from "./index.js";
import { createRenderProject, sceneTracks } from "./testing/renderProject.js";
import {
  addDamagedVideoAsset,
  movingMarkerVideo,
} from "./testing/testVideo.js";
import { failureOf, valueOf } from "./testing/valueOf.js";
import { createVideoProject, videoClipScene } from "./testing/videoProject.js";

async function cacheFolderOf(projectFolder: string): Promise<string> {
  const videoFrames = join(projectFolder, ".cache", "video-frames");
  const [folder, ...others] = await readdir(videoFrames);
  if (folder === undefined || others.length > 0) {
    throw new Error(
      `Expected one cache folder, found ${String(others.length + 1)}`,
    );
  }
  return join(videoFrames, folder);
}

async function modifiedTimesOf(folder: string): Promise<number[]> {
  const names = (await readdir(folder)).toSorted();
  return Promise.all(
    names.map(async (name) => (await stat(join(folder, name))).mtimeMs),
  );
}

function renderFirstFrame(folder: string) {
  return renderFrame({ folder, outputId: "wide", frame: 0, scale: 0.25 });
}

describe("the frame picture cache", () => {
  it("does not make the frame pictures again on a second render", async () => {
    const folder = await createVideoProject({
      video: movingMarkerVideo,
      clipFrames: 30,
    });
    valueOf(await renderFirstFrame(folder));
    const cacheFolder = await cacheFolderOf(folder);
    const firstTimes = await modifiedTimesOf(cacheFolder);

    valueOf(await renderFirstFrame(folder));

    expect(firstTimes).toHaveLength(61);
    await expect(modifiedTimesOf(cacheFolder)).resolves.toEqual(firstTimes);
  });

  it("makes a cache folder without complete.json again", async () => {
    const folder = await createVideoProject({
      video: movingMarkerVideo,
      clipFrames: 30,
    });
    valueOf(await renderFirstFrame(folder));
    const cacheFolder = await cacheFolderOf(folder);
    await rm(join(cacheFolder, "complete.json"));
    await writeFile(join(cacheFolder, "000001.jpg"), "not a picture");

    valueOf(await renderFirstFrame(folder));

    const names = await readdir(cacheFolder);
    expect(names).toContain("complete.json");
    expect((await stat(join(cacheFolder, "000001.jpg"))).size).toBeGreaterThan(
      100,
    );
  });

  it("returns video-frames-failed with the asset id for a damaged video file", async () => {
    const folder = await createRenderProject({
      edits: async (store) => [
        await addDamagedVideoAsset({ folder: store.folder, assetId: "broken" }),
        videoClipScene({ assetId: "broken" }),
        sceneTracks({
          tracks: [
            [
              {
                id: "shot",
                sceneId: "shot",
                startFrame: 0,
                durationFrames: 30,
              },
            ],
          ],
        }),
      ],
    });

    const failure = failureOf(await renderFirstFrame(folder));

    expect(failure).toMatchObject({
      kind: "video-frames-failed",
      assetId: "broken",
    });
    expect(
      failure.kind === "video-frames-failed" && failure.stderrTail,
    ).toMatch(/\S/);
  });
});
