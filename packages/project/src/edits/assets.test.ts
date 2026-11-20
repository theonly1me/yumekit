import { access } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  addAudioAsset,
  createTestProject,
  readProjectFile,
  writeProjectFile,
} from "../testing/projectFixtures.js";

const sha256OfAbc =
  "sha256:ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad";

const imageAsset = {
  id: "cover",
  kind: "image",
  file: "assets/files/cover.png",
  widthPixels: 640,
  heightPixels: 360,
  source: { kind: "import", originalName: "cover.png" },
} as const;

describe("asset edits", () => {
  it("addAsset records the asset with the SHA-256 of its file", async () => {
    const store = await createTestProject();
    await writeProjectFile({
      folder: store.folder,
      file: imageAsset.file,
      content: "abc",
    });
    await store.applyEdits([{ kind: "addAsset", asset: imageAsset }]);
    expect(store.read().assets).toEqual([
      { ...imageAsset, contentHash: sha256OfAbc, hasWords: false },
    ]);
  });

  it("addAsset writes the word timings next to the media file", async () => {
    const store = await createTestProject();
    const addVoice = await addAudioAsset({
      store,
      assetId: "voice",
      durationFrames: 90,
    });
    const words = { words: [{ text: "Hello", startFrame: 0, endFrame: 12 }] };
    await store.applyEdits([{ ...addVoice, words }]);
    expect(store.read().assets[0]?.hasWords).toBe(true);
    expect(
      JSON.parse(
        await readProjectFile({ store, file: "assets/files/voice.words.json" }),
      ),
    ).toEqual(words);
  });

  it("addAsset refuses an id that is in use", async () => {
    const store = await createTestProject();
    const addVoice = await addAudioAsset({
      store,
      assetId: "voice",
      durationFrames: 90,
    });
    const result = await store.applyEdits([addVoice, addVoice]);
    expect(result.ok || result.failure).toMatchObject({
      kind: "id-in-use",
      editIndex: 1,
    });
  });

  it("addAsset refuses a file that does not exist", async () => {
    const store = await createTestProject();
    const result = await store.applyEdits([
      { kind: "addAsset", asset: imageAsset },
    ]);
    expect(result.ok || result.failure.kind).toBe("not-found");
  });

  it.each(["cover.png", "assets/files/../../cover.png", "assets/cover.png"])(
    "addAsset refuses the file path %s outside assets/files/",
    async (file) => {
      const store = await createTestProject();
      const result = await store.applyEdits([
        { kind: "addAsset", asset: { ...imageAsset, file } },
      ]);
      expect(result.ok || result.failure.kind).toBe("invalid-value");
    },
  );

  it("removeAsset removes the record and keeps the media file", async () => {
    const store = await createTestProject();
    const addVoice = await addAudioAsset({
      store,
      assetId: "voice",
      durationFrames: 90,
    });
    await store.applyEdits([addVoice]);
    await store.applyEdits([{ kind: "removeAsset", assetId: "voice" }]);
    expect(store.read().assets).toEqual([]);
    await access(join(store.folder, "assets/files/voice.wav"));
  });

  it("removeAsset refuses an asset that does not exist", async () => {
    const store = await createTestProject();
    const result = await store.applyEdits([
      { kind: "removeAsset", assetId: "voice" },
    ]);
    expect(result.ok || result.failure.kind).toBe("not-found");
  });

  it("removeAsset refuses an asset that a clip and a cast member reference", async () => {
    const store = await createTestProject();
    const addVoice = await addAudioAsset({
      store,
      assetId: "voice",
      durationFrames: 90,
    });
    const member = {
      id: "host",
      name: "Host",
      description: "",
      referenceAssetIds: ["voice"],
    };
    await store.applyEdits([
      addVoice,
      {
        kind: "setBible",
        bible: { style: "", palette: [], cast: [member], voice: "" },
      },
      {
        kind: "setTimeline",
        timeline: {
          outputId: "wide",
          tracks: [
            {
              id: "narration",
              kind: "audio",
              clips: [
                {
                  id: "line",
                  assetId: "voice",
                  startFrame: 0,
                  durationFrames: 90,
                  assetStartFrame: 0,
                  gainDecibels: 0,
                },
              ],
            },
          ],
        },
      },
    ]);
    const result = await store.applyEdits([
      { kind: "removeAsset", assetId: "voice" },
    ]);
    expect(result.ok || result.failure.kind).toBe("still-referenced");
    expect(result.ok || result.failure.message).toContain('clip "line"');
    expect(result.ok || result.failure.message).toContain('cast member "host"');
  });
});
