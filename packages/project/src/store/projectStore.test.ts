import { access } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { openProject, type ProjectSnapshot } from "../index.js";
import {
  addAudioAsset,
  createTestProject,
  kitScene,
  moduleScene,
  readFolderFiles,
  sceneTrack,
} from "../testing/projectFixtures.js";

describe("ProjectStore", () => {
  it("changes no file when one edit in a batch is invalid", async () => {
    const store = await createTestProject();
    await store.applyEdits([kitScene("intro")]);
    const before = await readFolderFiles(store.folder);
    const result = await store.applyEdits([
      { kind: "setScript", script: "New script" },
      moduleScene({ sceneId: "custom", code: "x" }),
      { kind: "removeScene", sceneId: "missing" },
    ]);
    expect(result.ok || result.failure).toMatchObject({
      kind: "not-found",
      editIndex: 2,
    });
    expect(await readFolderFiles(store.folder)).toEqual(before);
    expect(store.read().script).toBe("");
  });

  it("undo and redo restore the exact file contents, scene code included", async () => {
    const store = await createTestProject();
    await store.applyEdits([
      moduleScene({ sceneId: "custom", code: "first code\n" }),
    ]);
    const firstFiles = await readFolderFiles(store.folder);
    await store.applyEdits([
      moduleScene({ sceneId: "custom", code: "second code\n" }),
      { kind: "setScript", script: "A script" },
    ]);
    const secondFiles = await readFolderFiles(store.folder);
    const withoutHistory = (files: Map<string, string>): Map<string, string> =>
      new Map([...files].filter(([file]) => !file.startsWith(".yumekit")));
    await store.undo();
    expect(withoutHistory(await readFolderFiles(store.folder))).toEqual(
      withoutHistory(firstFiles),
    );
    expect(store.read().sceneCode).toEqual({ custom: "first code\n" });
    await store.redo();
    expect(withoutHistory(await readFolderFiles(store.folder))).toEqual(
      withoutHistory(secondFiles),
    );
    expect(store.read().sceneCode).toEqual({ custom: "second code\n" });
  });

  it("undo of a removed scene brings back its folder and code", async () => {
    const store = await createTestProject();
    await store.applyEdits([
      moduleScene({ sceneId: "custom", code: "code\n" }),
    ]);
    await store.applyEdits([{ kind: "removeScene", sceneId: "custom" }]);
    await store.undo();
    expect(store.read().sceneCode).toEqual({ custom: "code\n" });
    await access(join(store.folder, "scenes/custom/scene.tsx"));
  });

  it("undo never deletes a media file", async () => {
    const store = await createTestProject();
    await store.applyEdits([
      await addAudioAsset({ store, assetId: "voice", durationFrames: 90 }),
    ]);
    await store.undo();
    expect(store.read().assets).toEqual([]);
    await access(join(store.folder, "assets/files/voice.wav"));
  });

  it("returns nothing-to-undo and nothing-to-redo at the ends of the history", async () => {
    const store = await createTestProject();
    expect(await store.undo()).toEqual({
      ok: false,
      failure: "nothing-to-undo",
    });
    expect(await store.redo()).toEqual({
      ok: false,
      failure: "nothing-to-redo",
    });
  });

  it("a new edit after undo clears the redo history", async () => {
    const store = await createTestProject();
    await store.applyEdits([{ kind: "setScript", script: "one" }]);
    await store.undo();
    await store.applyEdits([{ kind: "setScript", script: "two" }]);
    expect(await store.redo()).toEqual({
      ok: false,
      failure: "nothing-to-redo",
    });
  });

  it("increases the revision on each step and keeps it after openProject", async () => {
    const store = await createTestProject();
    expect(
      await store.applyEdits([{ kind: "setScript", script: "one" }]),
    ).toEqual({ ok: true, value: { revision: 1 } });
    expect(await store.undo()).toEqual({ ok: true, value: { revision: 2 } });
    expect(await store.redo()).toEqual({ ok: true, value: { revision: 3 } });
    const opened = await openProject({ folder: store.folder });
    expect(opened.ok && opened.value.read().revision).toBe(3);
    expect(opened.ok && (await opened.value.undo())).toEqual({
      ok: true,
      value: { revision: 4 },
    });
  });

  it("calls each listener with the new snapshot until it unsubscribes", async () => {
    const store = await createTestProject();
    const seen: ProjectSnapshot[] = [];
    const unsubscribe = store.subscribe((snapshot) => seen.push(snapshot));
    await store.applyEdits([{ kind: "setScript", script: "one" }]);
    unsubscribe();
    await store.applyEdits([{ kind: "setScript", script: "two" }]);
    expect(
      seen.map((snapshot) => [snapshot.revision, snapshot.script]),
    ).toEqual([[1, "one"]]);
  });

  it("returns a snapshot that a caller cannot change", async () => {
    const store = await createTestProject();
    await store.applyEdits([kitScene("intro")]);
    const snapshot = store.read();
    expect(() => {
      snapshot.scenes.length = 0;
    }).toThrow(TypeError);
    expect(() => Object.assign(snapshot.project, { name: "Changed" })).toThrow(
      TypeError,
    );
    expect(store.read().scenes.map((scene) => scene.id)).toEqual(["intro"]);
  });

  it("applies two concurrent calls one after the other", async () => {
    const store = await createTestProject();
    const [first, second] = await Promise.all([
      store.applyEdits([kitScene("intro")]),
      store.applyEdits([
        sceneTrack({
          trackId: "main",
          clips: [
            { id: "open", sceneId: "intro", startFrame: 0, durationFrames: 30 },
          ],
        }),
      ]),
    ]);
    expect([first, second]).toEqual([
      { ok: true, value: { revision: 1 } },
      { ok: true, value: { revision: 2 } },
    ]);
  });
});
