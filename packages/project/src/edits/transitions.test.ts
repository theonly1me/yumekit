import { describe, expect, it } from "vitest";
import { openProject } from "../index.js";
import {
  clipsOfMainTrack,
  projectWithOneClip,
} from "../testing/projectFixtures.js";

const fade = { kind: "fade" as const, durationFrames: 12 };

describe("clip transitions", () => {
  it("updateClip sets a transition, keeps it on a timing change, and cut removes it", async () => {
    const store = await projectWithOneClip();
    await store.applyEdits([
      {
        kind: "updateClip",
        outputId: "wide",
        clipId: "open",
        changes: { transition: fade },
      },
    ]);
    expect(clipsOfMainTrack(store)[0]).toMatchObject({ transition: fade });
    await store.applyEdits([
      {
        kind: "updateClip",
        outputId: "wide",
        clipId: "open",
        changes: { durationFrames: 40 },
      },
    ]);
    expect(clipsOfMainTrack(store)[0]).toMatchObject({
      durationFrames: 40,
      transition: fade,
    });
    await store.applyEdits([
      {
        kind: "updateClip",
        outputId: "wide",
        clipId: "open",
        changes: { transition: { kind: "cut" } },
      },
    ]);
    expect(clipsOfMainTrack(store)[0]).not.toHaveProperty("transition");
  });

  it("a stored transition is in the timeline file after the project opens again", async () => {
    const store = await projectWithOneClip();
    await store.applyEdits([
      {
        kind: "updateClip",
        outputId: "wide",
        clipId: "open",
        changes: { transition: { kind: "zoom", durationFrames: 9 } },
      },
    ]);
    const opened = await openProject({ folder: store.folder });
    if (!opened.ok) throw new Error(opened.failure.message);
    expect(clipsOfMainTrack(opened.value)[0]).toMatchObject({
      transition: { kind: "zoom", durationFrames: 9 },
    });
  });

  it("updateClip refuses a transition on an audio clip", async () => {
    const store = await projectWithOneClip();
    const withTrack = await store.applyEdits([
      {
        kind: "setTimeline",
        timeline: {
          outputId: "wide",
          tracks: [{ id: "sound", kind: "audio", clips: [] }],
        },
      },
      {
        kind: "addClip",
        outputId: "wide",
        trackId: "sound",
        clip: {
          id: "line",
          assetId: "voice",
          startFrame: 0,
          durationFrames: 30,
          assetStartFrame: 0,
          gainDecibels: 0,
        },
      },
      {
        kind: "updateClip",
        outputId: "wide",
        clipId: "line",
        changes: { transition: fade },
      },
    ]);
    expect(
      withTrack.ok || [withTrack.failure.kind, withTrack.failure.editIndex],
    ).toEqual(["invalid-value", 2]);
  });
});
