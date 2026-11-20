import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { openProject } from "../index.js";
import {
  createTestProject,
  kitScene,
  writeProjectFile,
} from "../testing/projectFixtures.js";

const cachePicture = ".cache/video-frames/sha256:00-30/000001.jpg";

async function projectWithCache() {
  const store = await createTestProject();
  await store.applyEdits([kitScene("intro")]);
  const cacheFiles = [
    { file: cachePicture, content: "not a picture" },
    { file: ".cache/video-frames/sha256:00-30/complete.json", content: "{" },
    { file: ".cache/scenes/broken/scene.json", content: "{ not json" },
    { file: ".cache/project.json", content: "[]" },
  ];
  for (const cacheFile of cacheFiles) {
    await writeProjectFile({ folder: store.folder, ...cacheFile });
  }
  return store;
}

describe("openProject and the .cache folder", () => {
  it("opens a project whose .cache folder has files that are not project files", async () => {
    const store = await projectWithCache();

    const opened = await openProject({ folder: store.folder });

    expect(opened.ok).toBe(true);
    expect(opened.ok && opened.value.read()).toEqual(store.read());
  });

  it("keeps the files in .cache when an edit writes the project", async () => {
    const store = await projectWithCache();
    const opened = await openProject({ folder: store.folder });
    if (!opened.ok) {
      throw new Error(opened.failure.message);
    }

    await opened.value.applyEdits([kitScene("outro")]);

    await expect(
      readFile(join(store.folder, cachePicture), "utf8"),
    ).resolves.toBe("not a picture");
  });
});
