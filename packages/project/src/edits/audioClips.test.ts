import { describe, expect, it } from "vitest";
import type { ProjectStore } from "../index.js";
import {
  addAudioAsset,
  createTestProject,
} from "../testing/projectFixtures.js";

const line = {
  id: "line",
  assetId: "voice",
  startFrame: 0,
  durationFrames: 60,
  assetStartFrame: 0,
  gainDecibels: 0,
};

async function projectWithNarrationTrack(): Promise<ProjectStore> {
  const store = await createTestProject();
  const addVoice = await addAudioAsset({
    store,
    assetId: "voice",
    durationFrames: 90,
  });
  const addPhoto = await addAudioAsset({
    store,
    assetId: "photo",
    durationFrames: 90,
  });
  const photo = {
    ...addPhoto,
    asset: { ...addPhoto.asset, kind: "image" as const },
  };
  await store.applyEdits([
    addVoice,
    photo,
    {
      kind: "setTimeline",
      timeline: {
        outputId: "wide",
        tracks: [{ id: "narration", kind: "audio", clips: [] }],
      },
    },
  ]);
  return store;
}

describe("audio clip edits", () => {
  it("addClip adds an audio clip and updateClip changes its gain", async () => {
    const store = await projectWithNarrationTrack();
    await store.applyEdits([
      { kind: "addClip", outputId: "wide", trackId: "narration", clip: line },
      {
        kind: "updateClip",
        outputId: "wide",
        clipId: "line",
        changes: { gainDecibels: -6 },
      },
    ]);
    expect(store.read().timelines[0]?.tracks[0]?.clips).toEqual([
      { ...line, gainDecibels: -6 },
    ]);
  });

  it("addClip refuses an audio clip of an image asset", async () => {
    const store = await projectWithNarrationTrack();
    const result = await store.applyEdits([
      {
        kind: "addClip",
        outputId: "wide",
        trackId: "narration",
        clip: { ...line, assetId: "photo" },
      },
    ]);
    expect(result.ok || result.failure.kind).toBe("invalid-value");
  });

  it("addClip refuses an audio clip of an asset that does not exist", async () => {
    const store = await projectWithNarrationTrack();
    const result = await store.applyEdits([
      {
        kind: "addClip",
        outputId: "wide",
        trackId: "narration",
        clip: { ...line, assetId: "music" },
      },
    ]);
    expect(result.ok || result.failure.kind).toBe("not-found");
  });

  it("updateClip refuses a start that reads past the end of the asset", async () => {
    const store = await projectWithNarrationTrack();
    await store.applyEdits([
      { kind: "addClip", outputId: "wide", trackId: "narration", clip: line },
    ]);
    const result = await store.applyEdits([
      {
        kind: "updateClip",
        outputId: "wide",
        clipId: "line",
        changes: { assetStartFrame: 31 },
      },
    ]);
    expect(result.ok || result.failure.kind).toBe("invalid-value");
  });

  it("updateClip refuses a sceneStartFrame on an audio clip", async () => {
    const store = await projectWithNarrationTrack();
    await store.applyEdits([
      { kind: "addClip", outputId: "wide", trackId: "narration", clip: line },
    ]);
    const result = await store.applyEdits([
      {
        kind: "updateClip",
        outputId: "wide",
        clipId: "line",
        changes: { sceneStartFrame: 3 },
      },
    ]);
    expect(result.ok || result.failure.kind).toBe("invalid-value");
  });

  it("removeClip removes an audio clip", async () => {
    const store = await projectWithNarrationTrack();
    await store.applyEdits([
      { kind: "addClip", outputId: "wide", trackId: "narration", clip: line },
    ]);
    await store.applyEdits([
      { kind: "removeClip", outputId: "wide", clipId: "line" },
    ]);
    expect(store.read().timelines[0]?.tracks[0]?.clips).toEqual([]);
  });
  it("addClip refuses an audio clip that reads past the end of its asset", async () => {
    const store = await projectWithNarrationTrack();
    const result = await store.applyEdits([
      {
        kind: "addClip",
        outputId: "wide",
        trackId: "narration",
        clip: { ...line, durationFrames: 91 },
      },
    ]);
    expect(result.ok || result.failure.kind).toBe("invalid-value");
  });
});
