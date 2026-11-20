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

describe("updateClip", () => {
  it("updateClip changes the timing of one clip", async () => {
    const store = await projectWithOneClip();
    await store.applyEdits([
      {
        kind: "updateClip",
        outputId: "wide",
        clipId: "open",
        changes: { startFrame: 12, durationFrames: 6 },
      },
    ]);
    expect(clipsOfMainTrack(store)).toEqual([
      {
        id: "open",
        sceneId: "intro",
        startFrame: 12,
        durationFrames: 6,
        sceneStartFrame: 0,
      },
    ]);
  });

  it("updateClip refuses a gain change on a scene clip", async () => {
    const store = await projectWithOneClip();
    const result = await store.applyEdits([
      {
        kind: "updateClip",
        outputId: "wide",
        clipId: "open",
        changes: { gainDecibels: -6 },
      },
    ]);
    expect(result.ok || result.failure.kind).toBe("invalid-value");
  });

  it("updateClip refuses a clip that does not exist", async () => {
    const store = await projectWithOneClip();
    const result = await store.applyEdits([
      {
        kind: "updateClip",
        outputId: "wide",
        clipId: "missing",
        changes: { startFrame: 1 },
      },
    ]);
    expect(result.ok || result.failure.kind).toBe("not-found");
  });

  it("updateClip refuses a change that makes two clips overlap", async () => {
    const store = await projectWithOneClip();
    await store.applyEdits([
      { kind: "addClip", outputId: "wide", trackId: "main", clip: nextClip },
    ]);
    const result = await store.applyEdits([
      {
        kind: "updateClip",
        outputId: "wide",
        clipId: "open",
        changes: { durationFrames: 31 },
      },
    ]);
    expect(result.ok || result.failure.kind).toBe("clips-overlap");
  });

  it("updateClip refuses a duration of 0 frames", async () => {
    const store = await projectWithOneClip();
    const result = await store.applyEdits([
      {
        kind: "updateClip",
        outputId: "wide",
        clipId: "open",
        changes: { durationFrames: 0 },
      },
    ]);
    expect(result.ok || result.failure.kind).toBe("invalid-value");
  });
});
