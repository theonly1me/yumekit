import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { createProject, openProject, videoStyleOf } from "../index.js";
import {
  createTestProject,
  readProjectFile,
  temporaryFolder,
  wideOutput,
} from "../testing/projectFixtures.js";

describe("the video style of a project", () => {
  it("is graphics for a project file with no videoStyle", async () => {
    const store = await createTestProject();
    const file: unknown = JSON.parse(
      await readProjectFile({ store, file: "project.json" }),
    );

    const reopened = await openProject({ folder: store.folder });

    expect(file).not.toHaveProperty("videoStyle");
    expect(reopened.ok && videoStyleOf(reopened.value.read().project)).toBe(
      "graphics",
    );
  });

  it("is written to project.json when a new project names it", async () => {
    const created = await createProject({
      folder: join(await temporaryFolder(), "project"),
      name: "Clips",
      framesPerSecond: 30,
      outputs: [wideOutput],
      videoStyle: "ai-video",
    });
    if (!created.ok) throw new Error(created.failure.message);

    const file: unknown = JSON.parse(
      await readProjectFile({ store: created.value, file: "project.json" }),
    );

    expect(file).toMatchObject({ videoStyle: "ai-video" });
  });

  it("changes with setVideoStyle as one undo step", async () => {
    const store = await createTestProject();
    const before = await readProjectFile({ store, file: "project.json" });

    await store.applyEdits([{ kind: "setVideoStyle", videoStyle: "mix" }]);
    const changed: unknown = JSON.parse(
      await readProjectFile({ store, file: "project.json" }),
    );
    await store.undo();

    expect(changed).toMatchObject({ videoStyle: "mix" });
    expect(await readProjectFile({ store, file: "project.json" })).toBe(before);
  });
});
