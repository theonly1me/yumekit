import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { createProject, isCalm, lookOf, openProject } from "../index.js";
import {
  createTestProject,
  readProjectFile,
  temporaryFolder,
  wideOutput,
} from "../testing/projectFixtures.js";

describe("the look of a project", () => {
  it("reads paper for a project with no look, so an old project does not change", async () => {
    const store = await createTestProject();

    expect(store.read().project.look).toBeUndefined();
    expect(lookOf(store.read().project)).toBe("paper");
    expect(
      await readProjectFile({ store, file: "project.json" }),
    ).not.toContain("look");
  });

  it("setLook writes the look to project.json as one undo step", async () => {
    const store = await createTestProject();

    await store.applyEdits([{ kind: "setLook", look: "neon" }]);

    expect(lookOf(store.read().project)).toBe("neon");
    expect(await readProjectFile({ store, file: "project.json" })).toContain(
      '"look": "neon"',
    );
    await store.undo();
    expect(lookOf(store.read().project)).toBe("paper");
  });

  it("reads a project with no calm value as not calm", async () => {
    const store = await createTestProject();

    expect(isCalm(store.read().project)).toBe(false);
  });

  it("setLook with calm writes calm next to the look, and keeps it when a later setLook leaves it out", async () => {
    const store = await createTestProject();

    await store.applyEdits([{ kind: "setLook", look: "neon", calm: true }]);
    await store.applyEdits([{ kind: "setLook", look: "studio" }]);

    expect(store.read().project).toMatchObject({ look: "studio", calm: true });
    expect(await readProjectFile({ store, file: "project.json" })).toContain(
      '"calm": true',
    );
    await store.undo();
    await store.undo();
    expect(isCalm(store.read().project)).toBe(false);
  });

  it("createProject takes a look, and openProject reads it back", async () => {
    const folder = join(await temporaryFolder(), "project");
    await createProject({
      folder,
      name: "Night",
      framesPerSecond: 30,
      outputs: [wideOutput],
      look: "midnight",
    });

    const opened = await openProject({ folder });

    expect(opened.ok && lookOf(opened.value.read().project)).toBe("midnight");
  });
});
