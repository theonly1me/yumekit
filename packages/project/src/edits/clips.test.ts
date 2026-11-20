import { describe, expect, it } from "vitest";
import {
  clipsOfMainTrack,
  projectWithOneClip,
} from "../testing/projectFixtures.js";

const nextClip = {
  id: "next",
  sceneId: "intro",
  startFrame: 30,
  durationFrames: 30,
  sceneStartFrame: 5,
};

describe("clip edits", () => {
  it("addClip adds a clip to the track", async () => {
    const store = await projectWithOneClip();
    await store.applyEdits([
      { kind: "addClip", outputId: "wide", trackId: "main", clip: nextClip },
    ]);
    expect(clipsOfMainTrack(store)).toEqual([
      {
        id: "open",
        sceneId: "intro",
        startFrame: 0,
        durationFrames: 30,
        sceneStartFrame: 0,
      },
      nextClip,
    ]);
  });

  it("addClip refuses a track that does not exist", async () => {
    const store = await projectWithOneClip();
    const result = await store.applyEdits([
      { kind: "addClip", outputId: "wide", trackId: "music", clip: nextClip },
    ]);
    expect(result.ok || result.failure.kind).toBe("not-found");
  });

  it("addClip refuses an audio clip on a scene track", async () => {
    const store = await projectWithOneClip();
    const audioClip = {
      id: "line",
      assetId: "voice",
      startFrame: 30,
      durationFrames: 30,
      assetStartFrame: 0,
      gainDecibels: 0,
    };
    const result = await store.applyEdits([
      { kind: "addClip", outputId: "wide", trackId: "main", clip: audioClip },
    ]);
    expect(result.ok || result.failure.kind).toBe("invalid-value");
  });

  it("addClip refuses a clip that overlaps another clip", async () => {
    const store = await projectWithOneClip();
    const result = await store.applyEdits([
      {
        kind: "addClip",
        outputId: "wide",
        trackId: "main",
        clip: { ...nextClip, startFrame: 10 },
      },
    ]);
    expect(result.ok || result.failure.kind).toBe("clips-overlap");
  });

  it("addClip refuses a clip id that is in use in the timeline", async () => {
    const store = await projectWithOneClip();
    const result = await store.applyEdits([
      {
        kind: "addClip",
        outputId: "wide",
        trackId: "main",
        clip: { ...nextClip, id: "open" },
      },
    ]);
    expect(result.ok || result.failure.kind).toBe("id-in-use");
  });

  it("removeClip removes one clip", async () => {
    const store = await projectWithOneClip();
    await store.applyEdits([
      { kind: "removeClip", outputId: "wide", clipId: "open" },
    ]);
    expect(clipsOfMainTrack(store)).toEqual([]);
  });

  it("removeClip refuses a clip that does not exist", async () => {
    const store = await projectWithOneClip();
    const result = await store.applyEdits([
      { kind: "removeClip", outputId: "wide", clipId: "missing" },
    ]);
    expect(result.ok || result.failure.kind).toBe("not-found");
  });

  it("removeClip refuses an output that does not exist", async () => {
    const store = await projectWithOneClip();
    const result = await store.applyEdits([
      { kind: "removeClip", outputId: "tall", clipId: "open" },
    ]);
    expect(result.ok || result.failure.kind).toBe("not-found");
  });
  it("addClip refuses a clip of a scene that does not exist", async () => {
    const store = await projectWithOneClip();
    const result = await store.applyEdits([
      {
        kind: "addClip",
        outputId: "wide",
        trackId: "main",
        clip: { ...nextClip, sceneId: "outro" },
      },
    ]);
    expect(result.ok || result.failure.kind).toBe("not-found");
  });
});
