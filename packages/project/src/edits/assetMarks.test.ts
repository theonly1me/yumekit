import { describe, expect, it } from "vitest";
import {
  addAudioAsset,
  createTestProject,
  writeProjectFile,
} from "../testing/projectFixtures.js";

const recording = {
  id: "recording",
  kind: "video",
  file: "assets/files/recording.mp4",
  widthPixels: 2880,
  heightPixels: 1800,
  durationFrames: 90,
  source: { kind: "import", originalName: "recording.mp4" },
} as const;

const preview = {
  name: "the preview",
  region: { x: 0.25, y: 0.1, width: 0.5, height: 0.4 },
  seconds: 2,
};

async function projectWithRecording() {
  const store = await createTestProject();
  await writeProjectFile({
    folder: store.folder,
    file: recording.file,
    content: "video",
  });
  await store.applyEdits([{ kind: "addAsset", asset: recording }]);
  return store;
}

describe("asset marks", () => {
  it("addAsset keeps the marks of a new asset", async () => {
    const store = await createTestProject();
    await writeProjectFile({
      folder: store.folder,
      file: recording.file,
      content: "video",
    });
    await store.applyEdits([
      { kind: "addAsset", asset: { ...recording, marks: [preview] } },
    ]);
    expect(store.read().assets[0]?.marks).toEqual([preview]);
  });

  it("setAssetMarks replaces the marks, and undo brings the old ones back", async () => {
    const store = await projectWithRecording();
    await store.applyEdits([
      { kind: "setAssetMarks", assetId: "recording", marks: [preview] },
    ]);
    expect(store.read().assets[0]?.marks).toEqual([preview]);
    await store.undo();
    expect(store.read().assets[0]).not.toHaveProperty("marks");
  });

  it("setAssetMarks with no marks removes the field", async () => {
    const store = await projectWithRecording();
    await store.applyEdits([
      { kind: "setAssetMarks", assetId: "recording", marks: [preview] },
    ]);
    await store.applyEdits([
      { kind: "setAssetMarks", assetId: "recording", marks: [] },
    ]);
    expect(store.read().assets[0]).not.toHaveProperty("marks");
  });

  it("refuses marks on an audio asset", async () => {
    const store = await createTestProject();
    const addVoice = await addAudioAsset({
      store,
      assetId: "voice",
      durationFrames: 30,
    });
    await store.applyEdits([addVoice]);
    const result = await store.applyEdits([
      { kind: "setAssetMarks", assetId: "voice", marks: [preview] },
    ]);
    expect(result).toMatchObject({ ok: false });
  });

  it("refuses a region that leaves the picture and two marks with one name", async () => {
    const store = await projectWithRecording();
    const outside = await store.applyEdits([
      {
        kind: "setAssetMarks",
        assetId: "recording",
        marks: [
          { name: "edge", region: { x: 0.6, y: 0, width: 0.5, height: 1 } },
        ],
      },
    ]);
    const twice = await store.applyEdits([
      {
        kind: "setAssetMarks",
        assetId: "recording",
        marks: [preview, { name: "the preview", seconds: 1 }],
      },
    ]);
    expect(outside).toMatchObject({ ok: false });
    expect(twice).toMatchObject({ ok: false });
    expect(store.read().assets[0]).not.toHaveProperty("marks");
  });
});
