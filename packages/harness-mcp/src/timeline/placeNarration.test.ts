import { describe, expect, it } from "vitest";
import { harnessWithSpeech, timelineOf } from "../testing/narrationFixture.js";

describe("place_narration", () => {
  it("adds an audio track and a caption track on top, with clips that match the speech length", async () => {
    const harness = await harnessWithSpeech();

    const result = await harness.call({
      name: "place_narration",
      arguments: {
        output_id: "wide",
        asset_id: "line-one",
        start_frame: 12,
        with_captions: true,
      },
    });

    expect(result.data).toMatchObject({ start_frame: 12, end_frame: 48 });
    const tracks = timelineOf(harness).tracks;
    expect(tracks.map((track) => [track.id, track.kind])).toEqual([
      ["main", "scene"],
      ["captions", "scene"],
      ["narration", "audio"],
    ]);
    const [, captionTrack, audioTrack] = tracks;
    expect(audioTrack?.clips).toEqual([
      {
        id: "narration-line-one",
        assetId: "line-one",
        startFrame: 12,
        durationFrames: 36,
        assetStartFrame: 0,
        gainDecibels: 0,
      },
    ]);
    expect(captionTrack?.clips).toEqual([
      {
        id: "captions-line-one",
        sceneId: "captions-line-one",
        startFrame: 12,
        durationFrames: 36,
        sceneStartFrame: 0,
      },
    ]);
    expect(
      harness.store
        .read()
        .scenes.find((scene) => scene.id === "captions-line-one")?.source,
    ).toEqual({
      kind: "kit",
      component: "caption-words",
      props: { assetId: "line-one" },
    });
  });

  it("puts a second narration on the same audio and caption tracks", async () => {
    const harness = await harnessWithSpeech();
    await harness.call({
      name: "generate_asset",
      arguments: {
        asset_id: "line-two",
        capability: "speech",
        input: { text: "five six" },
      },
    });
    const place = (options: { assetId: string; startFrame: number }) =>
      harness.call({
        name: "place_narration",
        arguments: {
          output_id: "wide",
          asset_id: options.assetId,
          start_frame: options.startFrame,
          with_captions: true,
        },
      });

    await place({ assetId: "line-one", startFrame: 0 });
    const second = await place({ assetId: "line-two", startFrame: 36 });

    expect(second.isError).toBe(false);
    expect(
      timelineOf(harness).tracks.map((track) => track.clips.length),
    ).toEqual([1, 2, 2]);
  });

  it("is one undo step", async () => {
    const harness = await harnessWithSpeech();
    const before = timelineOf(harness);

    await harness.call({
      name: "place_narration",
      arguments: {
        output_id: "wide",
        asset_id: "line-one",
        start_frame: 0,
        with_captions: true,
      },
    });
    await harness.call({ name: "undo" });

    expect(timelineOf(harness)).toEqual(before);
    expect(harness.store.read().scenes.map((scene) => scene.id)).toEqual([
      "intro",
    ]);
  });
});
