import type { Timeline } from "@yumekit/project";
import { describe, expect, it } from "vitest";
import type { Harness } from "../testing/harnessFixture.js";
import { harnessWithThreeScenes } from "../testing/sceneClipFixture.js";

const newScript =
  "Meet the tea that wakes you up gently, with no jitters at all.";

function otherTracksOf(timeline: Timeline) {
  return JSON.stringify(
    timeline.tracks.filter(
      (track) => track.id !== "voice" && track.id !== "captions",
    ),
  );
}

async function videoWithVoiceAndSlides(): Promise<Harness> {
  const harness = await harnessWithThreeScenes({ withVoice: true });
  await harness.call({ name: "set_transitions", arguments: { kind: "slide" } });
  await harness.call({ name: "set_script", arguments: { script: newScript } });
  return harness;
}

describe("replace_narration", () => {
  it("changes the voice and the captions and no other byte of each timeline", async () => {
    const harness = await videoWithVoiceAndSlides();
    const before = harness.store.read().timelines;

    const result = await harness.call({ name: "replace_narration" });

    expect(result.isError).toBe(false);
    const after = harness.store.read();
    for (const [index, timeline] of after.timelines.entries()) {
      const earlier = before[index];
      if (earlier === undefined) throw new Error("A timeline is missing");
      expect(otherTracksOf(timeline)).toBe(otherTracksOf(earlier));
      expect(timeline.tracks.map((track) => track.id)).toEqual(
        earlier.tracks.map((track) => track.id),
      );
      const voice = timeline.tracks.find((track) => track.id === "voice");
      const captions = timeline.tracks.find((track) => track.id === "captions");
      expect(voice?.clips.map((clip) => clip.id)).toEqual(["narration-voice"]);
      expect(captions?.clips.map((clip) => clip.id)).toEqual([
        "captions-voice",
      ]);
    }
    const voiceAsset = after.assets.find((asset) => asset.id === "voice");
    expect(voiceAsset?.source).toMatchObject({
      server: "local-voice",
      input: { text: newScript },
    });
  });

  it("refuses a text that is not in the script, with the lines of the script", async () => {
    const harness = await videoWithVoiceAndSlides();
    const before = JSON.stringify(harness.store.read().timelines);

    const result = await harness.call({
      name: "replace_narration",
      arguments: { text: "A line that the person never wrote." },
    });

    expect(result.data).toMatchObject({ kind: "text-not-in-the-script" });
    expect(result.text).toContain(`- ${newScript}`);
    expect(JSON.stringify(harness.store.read().timelines)).toBe(before);
  });

  it("refuses a placed voice whose words are not in the script", async () => {
    const harness = await videoWithVoiceAndSlides();

    const result = await harness.call({
      name: "place_narration",
      arguments: {
        output_id: "wide",
        asset_id: "line",
        start_frame: 0,
        partial: true,
      },
    });

    expect(result.data).toMatchObject({ kind: "text-not-in-the-script" });
  });
});
