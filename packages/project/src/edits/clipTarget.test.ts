import { describe, expect, it } from "vitest";
import type { Edit, ProjectStore } from "../index.js";
import {
  addAudioAsset,
  createTestProject,
  kitScene,
} from "../testing/projectFixtures.js";

type ClipChanges = Extract<Edit, { kind: "updateClip" }>["changes"];

const sceneClip = {
  id: "open",
  sceneId: "intro",
  startFrame: 0,
  durationFrames: 30,
  sceneStartFrame: 0,
};

const audioClip = {
  id: "line",
  assetId: "voice",
  startFrame: 0,
  durationFrames: 60,
  assetStartFrame: 0,
  gainDecibels: 0,
};

async function projectWithTargets(): Promise<ProjectStore> {
  const store = await createTestProject();
  const voice = await addAudioAsset({
    store,
    assetId: "voice",
    durationFrames: 90,
  });
  const other = await addAudioAsset({
    store,
    assetId: "other",
    durationFrames: 75,
  });
  const short = await addAudioAsset({
    store,
    assetId: "short",
    durationFrames: 30,
  });
  const photo = await addAudioAsset({
    store,
    assetId: "photo",
    durationFrames: 90,
  });
  await store.applyEdits([
    kitScene("intro"),
    kitScene("outro"),
    voice,
    other,
    short,
    { ...photo, asset: { ...photo.asset, kind: "image" as const } },
    {
      kind: "setTimeline",
      timeline: {
        outputId: "wide",
        tracks: [
          { id: "main", kind: "scene", clips: [sceneClip] },
          { id: "narration", kind: "audio", clips: [audioClip] },
        ],
      },
    },
  ]);
  return store;
}

async function updateClip(options: {
  store: ProjectStore;
  clipId: string;
  changes: ClipChanges;
}) {
  return options.store.applyEdits([
    {
      kind: "updateClip",
      outputId: "wide",
      clipId: options.clipId,
      changes: options.changes,
    },
  ]);
}

function tracksOf(store: ProjectStore): unknown[] {
  return (store.read().timelines[0]?.tracks ?? []).map((track) => track.clips);
}

describe("updateClip changes the target of a clip", () => {
  it("shows another scene in the same place after a sceneId change", async () => {
    const store = await projectWithTargets();
    const result = await updateClip({
      store,
      clipId: "open",
      changes: { sceneId: "outro" },
    });
    expect(result.ok).toBe(true);
    expect(tracksOf(store)).toEqual([
      [{ ...sceneClip, sceneId: "outro" }],
      [audioClip],
    ]);
  });

  it("plays another audio asset after an assetId change", async () => {
    const store = await projectWithTargets();
    const result = await updateClip({
      store,
      clipId: "line",
      changes: { assetId: "other" },
    });
    expect(result.ok).toBe(true);
    expect(tracksOf(store)).toEqual([
      [sceneClip],
      [{ ...audioClip, assetId: "other" }],
    ]);
  });

  it("refuses a scene that does not exist", async () => {
    const store = await projectWithTargets();
    const result = await updateClip({
      store,
      clipId: "open",
      changes: { sceneId: "missing" },
    });
    expect(result.ok || result.failure.kind).toBe("not-found");
    expect(tracksOf(store)).toEqual([[sceneClip], [audioClip]]);
  });

  it("refuses an assetId on a scene clip", async () => {
    const store = await projectWithTargets();
    const result = await updateClip({
      store,
      clipId: "open",
      changes: { assetId: "voice" },
    });
    expect(result.ok || result.failure.kind).toBe("invalid-value");
  });

  it("refuses a sceneId on an audio clip", async () => {
    const store = await projectWithTargets();
    const result = await updateClip({
      store,
      clipId: "line",
      changes: { sceneId: "outro" },
    });
    expect(result.ok || result.failure.kind).toBe("invalid-value");
  });

  it("refuses an asset that does not exist", async () => {
    const store = await projectWithTargets();
    const result = await updateClip({
      store,
      clipId: "line",
      changes: { assetId: "missing" },
    });
    expect(result.ok || result.failure.kind).toBe("not-found");
  });

  it("refuses an asset that is not audio", async () => {
    const store = await projectWithTargets();
    const result = await updateClip({
      store,
      clipId: "line",
      changes: { assetId: "photo" },
    });
    expect(result.ok || result.failure.kind).toBe("invalid-value");
  });

  it("refuses an asset that the clip reads past the end of", async () => {
    const store = await projectWithTargets();
    const result = await updateClip({
      store,
      clipId: "line",
      changes: { assetId: "short" },
    });
    expect(result.ok || result.failure.kind).toBe("invalid-value");
    expect(tracksOf(store)).toEqual([[sceneClip], [audioClip]]);
  });
});
