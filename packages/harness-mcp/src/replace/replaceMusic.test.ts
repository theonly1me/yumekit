import { describe, expect, it } from "vitest";
import { harnessWithThreeScenes } from "../testing/sceneClipFixture.js";

describe("replace_music", () => {
  it("puts new music over the whole video with the old volume, and changes no other track", async () => {
    const harness = await harnessWithThreeScenes();
    const otherTracks = () =>
      JSON.stringify(
        harness.store
          .read()
          .timelines.map((timeline) =>
            timeline.tracks.filter((track) => track.id !== "music"),
          ),
      );
    const before = otherTracks();

    const result = await harness.call({
      name: "replace_music",
      arguments: { prompt: "warm piano", gain_decibels: -15 },
    });

    expect(result.isError).toBe(false);
    expect(otherTracks()).toBe(before);
    const [wide] = harness.store.read().timelines;
    const music = wide?.tracks.find((track) => track.id === "music");
    expect(
      music?.clips.map((clip) => [
        clip.startFrame,
        clip.durationFrames,
        "assetId" in clip ? clip.gainDecibels : undefined,
      ]),
    ).toEqual([[0, 90, -15]]);
  });
});
