import { access } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  createTestProject,
  kitScene,
  moduleScene,
  readProjectFile,
  sceneTrack,
} from "../testing/projectFixtures.js";

describe("scene edits", () => {
  it("putScene adds a kit scene as scenes/<id>/scene.json", async () => {
    const store = await createTestProject();
    await store.applyEdits([kitScene("intro")]);
    expect(store.read().scenes.map((scene) => scene.id)).toEqual(["intro"]);
    expect(
      JSON.parse(
        await readProjectFile({ store, file: "scenes/intro/scene.json" }),
      ),
    ).toMatchObject({ id: "intro", source: { component: "title-card" } });
  });

  it("putScene writes the code of a module scene to scene.tsx", async () => {
    const store = await createTestProject();
    const code = "export default function Scene() { return null; }\n";
    await store.applyEdits([moduleScene({ sceneId: "custom", code })]);
    expect(store.read().sceneCode).toEqual({ custom: code });
    expect(
      await readProjectFile({ store, file: "scenes/custom/scene.tsx" }),
    ).toBe(code);
  });

  it("putScene replaces a module scene with a kit scene and deletes scene.tsx", async () => {
    const store = await createTestProject();
    await store.applyEdits([moduleScene({ sceneId: "custom", code: "x" })]);
    await store.applyEdits([kitScene("custom")]);
    expect(store.read().sceneCode).toEqual({});
    await expect(
      access(join(store.folder, "scenes/custom/scene.tsx")),
    ).rejects.toThrow();
  });

  it("putScene refuses a module scene without code", async () => {
    const store = await createTestProject();
    const result = await store.applyEdits([
      {
        kind: "putScene",
        scene: {
          id: "custom",
          title: "",
          notes: "",
          source: { kind: "module", props: {} },
        },
      },
    ]);
    expect(result.ok || result.failure.kind).toBe("invalid-value");
  });

  it("putScene refuses code for a kit scene", async () => {
    const store = await createTestProject();
    const result = await store.applyEdits([
      { ...kitScene("intro"), code: "x" },
    ]);
    expect(result.ok || result.failure.kind).toBe("invalid-value");
  });

  it("putScene refuses an id with capital letters", async () => {
    const store = await createTestProject();
    const result = await store.applyEdits([kitScene("Intro")]);
    expect(result.ok || result.failure.kind).toBe("invalid-value");
  });

  it("removeScene removes the scene and its folder", async () => {
    const store = await createTestProject();
    await store.applyEdits([moduleScene({ sceneId: "custom", code: "x" })]);
    await store.applyEdits([{ kind: "removeScene", sceneId: "custom" }]);
    expect(store.read().scenes).toEqual([]);
    expect(store.read().sceneCode).toEqual({});
    await expect(access(join(store.folder, "scenes/custom"))).rejects.toThrow();
  });

  it("removeScene refuses a scene that does not exist", async () => {
    const store = await createTestProject();
    const result = await store.applyEdits([
      { kind: "removeScene", sceneId: "intro" },
    ]);
    expect(result.ok || result.failure.kind).toBe("not-found");
  });

  it("removeScene refuses a referenced scene and names each clip", async () => {
    const store = await createTestProject();
    await store.applyEdits([
      kitScene("intro"),
      sceneTrack({
        trackId: "main",
        clips: [
          { id: "open", sceneId: "intro", startFrame: 0, durationFrames: 30 },
          { id: "close", sceneId: "intro", startFrame: 60, durationFrames: 30 },
        ],
      }),
    ]);
    const result = await store.applyEdits([
      { kind: "removeScene", sceneId: "intro" },
    ]);
    expect(result.ok || result.failure.kind).toBe("still-referenced");
    expect(result.ok || result.failure.message).toContain('clip "open"');
    expect(result.ok || result.failure.message).toContain('clip "close"');
  });
});
