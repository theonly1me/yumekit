import { describe, expect, it } from "vitest";
import type { ProjectStore } from "../index.js";
import {
  addAudioAsset,
  createTestProject,
  readProjectFile,
  writeProjectFile,
} from "../testing/projectFixtures.js";

const firstWords = { words: [{ text: "Hello", startFrame: 0, endFrame: 12 }] };
const secondWords = { words: [{ text: "World", startFrame: 3, endFrame: 20 }] };

async function projectWithVoice(): Promise<ProjectStore> {
  const store = await createTestProject();
  await store.applyEdits([
    await addAudioAsset({ store, assetId: "voice", durationFrames: 90 }),
  ]);
  return store;
}

describe("setAssetWords and readAssetWords", () => {
  it("setAssetWords writes the words file and sets hasWords", async () => {
    const store = await projectWithVoice();
    await store.applyEdits([
      { kind: "setAssetWords", assetId: "voice", words: firstWords },
    ]);
    expect(store.read().assets[0]?.hasWords).toBe(true);
    expect(
      JSON.parse(
        await readProjectFile({ store, file: "assets/files/voice.words.json" }),
      ),
    ).toEqual(firstWords);
    expect(await store.readAssetWords("voice")).toEqual({
      ok: true,
      value: firstWords,
    });
  });

  it("setAssetWords refuses an asset that does not exist", async () => {
    const store = await createTestProject();
    const result = await store.applyEdits([
      { kind: "setAssetWords", assetId: "voice", words: firstWords },
    ]);
    expect(result.ok || result.failure.kind).toBe("not-found");
  });

  it("setAssetWords refuses an asset that is not audio", async () => {
    const store = await createTestProject();
    await writeProjectFile({
      folder: store.folder,
      file: "assets/files/cover.png",
      content: "png",
    });
    await store.applyEdits([
      {
        kind: "addAsset",
        asset: {
          id: "cover",
          kind: "image",
          file: "assets/files/cover.png",
          source: { kind: "import", originalName: "cover.png" },
        },
      },
    ]);
    const result = await store.applyEdits([
      { kind: "setAssetWords", assetId: "cover", words: firstWords },
    ]);
    expect(result.ok || result.failure.kind).toBe("invalid-value");
  });

  it("undo restores the earlier words file and redo restores the new one", async () => {
    const store = await projectWithVoice();
    await store.applyEdits([
      { kind: "setAssetWords", assetId: "voice", words: firstWords },
    ]);
    const firstFile = await readProjectFile({
      store,
      file: "assets/files/voice.words.json",
    });
    await store.applyEdits([
      { kind: "setAssetWords", assetId: "voice", words: secondWords },
    ]);
    const secondFile = await readProjectFile({
      store,
      file: "assets/files/voice.words.json",
    });
    await store.undo();
    expect(
      await readProjectFile({ store, file: "assets/files/voice.words.json" }),
    ).toBe(firstFile);
    expect(await store.readAssetWords("voice")).toEqual({
      ok: true,
      value: firstWords,
    });
    await store.redo();
    expect(
      await readProjectFile({ store, file: "assets/files/voice.words.json" }),
    ).toBe(secondFile);
    expect(await store.readAssetWords("voice")).toEqual({
      ok: true,
      value: secondWords,
    });
  });

  it("undo of the first words of an asset clears hasWords", async () => {
    const store = await projectWithVoice();
    await store.applyEdits([
      { kind: "setAssetWords", assetId: "voice", words: firstWords },
    ]);
    await store.undo();
    expect(store.read().assets[0]?.hasWords).toBe(false);
    expect(await store.readAssetWords("voice")).toEqual({
      ok: false,
      failure: "not-found",
    });
  });

  it("readAssetWords returns not-found for an asset without words", async () => {
    const store = await projectWithVoice();
    expect(await store.readAssetWords("voice")).toEqual({
      ok: false,
      failure: "not-found",
    });
  });

  it("readAssetWords returns not-found for a missing asset", async () => {
    const store = await createTestProject();
    expect(await store.readAssetWords("voice")).toEqual({
      ok: false,
      failure: "not-found",
    });
  });
});
