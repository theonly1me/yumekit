import { rm } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { openProject, type OpenFailure } from "../index.js";
import {
  createTestProject,
  kitScene,
  moduleScene,
  temporaryFolder,
  writeProjectFile,
} from "../testing/projectFixtures.js";

async function damagedProject(options: {
  file: string;
  content: string;
}): Promise<OpenFailure | undefined> {
  const store = await createTestProject();
  await writeProjectFile({ folder: store.folder, ...options });
  const opened = await openProject({ folder: store.folder });
  return opened.ok ? undefined : opened.failure;
}

describe("openProject failures", () => {
  it("returns folder-not-found for a folder that does not exist", async () => {
    const opened = await openProject({
      folder: join(await temporaryFolder(), "missing"),
    });
    expect(opened.ok || opened.failure.kind).toBe("folder-not-found");
  });

  it("returns not-a-project for a folder without project.json", async () => {
    const opened = await openProject({ folder: await temporaryFolder() });
    expect(opened.ok || opened.failure.kind).toBe("not-a-project");
  });

  it("returns unsupported-format-version for format version 2", async () => {
    const failure = await damagedProject({
      file: "project.json",
      content: '{ "formatVersion": 2 }\n',
    });
    expect(failure?.kind).toBe("unsupported-format-version");
  });

  it("returns invalid-file with the file for a JSON syntax error", async () => {
    const failure = await damagedProject({
      file: "bible.json",
      content: "{ not json",
    });
    expect(failure).toMatchObject({ kind: "invalid-file", file: "bible.json" });
  });

  it("returns invalid-file with the schema error for a wrong field type", async () => {
    const failure = await damagedProject({
      file: "project.json",
      content:
        '{ "formatVersion": 1, "name": "x", "framesPerSecond": 29, "outputs": [] }\n',
    });
    expect(failure).toMatchObject({
      kind: "invalid-file",
      file: "project.json",
    });
    expect(failure?.message).toContain("framesPerSecond");
  });

  it("returns invalid-file for a missing script.md", async () => {
    const store = await createTestProject();
    await rm(join(store.folder, "script.md"));
    const opened = await openProject({ folder: store.folder });
    expect(opened.ok || opened.failure).toMatchObject({
      kind: "invalid-file",
      file: "script.md",
    });
  });

  it("returns invalid-file for a hand-edited timeline with overlapping clips", async () => {
    const store = await createTestProject();
    await store.applyEdits([kitScene("intro")]);
    const clip = { sceneId: "intro", durationFrames: 30, sceneStartFrame: 0 };
    await writeProjectFile({
      folder: store.folder,
      file: "timelines/wide.json",
      content: JSON.stringify({
        outputId: "wide",
        tracks: [
          {
            id: "main",
            kind: "scene",
            clips: [
              { ...clip, id: "first", startFrame: 0 },
              { ...clip, id: "second", startFrame: 29 },
            ],
          },
        ],
      }),
    });
    const opened = await openProject({ folder: store.folder });
    expect(opened.ok || opened.failure).toMatchObject({
      kind: "invalid-file",
      file: "timelines/wide.json",
    });
  });

  it("returns invalid-file for a module scene without scene.tsx", async () => {
    const store = await createTestProject();
    await store.applyEdits([moduleScene({ sceneId: "custom", code: "x" })]);
    await rm(join(store.folder, "scenes/custom/scene.tsx"));
    const opened = await openProject({ folder: store.folder });
    expect(opened.ok || opened.failure).toMatchObject({
      kind: "invalid-file",
      file: "scenes/custom/scene.tsx",
    });
  });
});
