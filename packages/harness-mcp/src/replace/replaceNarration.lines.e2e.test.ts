import { describe, expect, it } from "vitest";
import type { Harness } from "../testing/harnessFixture.js";
import { harnessWithThreeScenes } from "../testing/sceneClipFixture.js";

const lines = ["Calm tea.", "Hoshi helps.", "Try it."];

async function voiceForEachLine(harness: Harness): Promise<void> {
  await harness.call({
    name: "set_script",
    arguments: { script: lines.join("\n") },
  });
  for (const [index, text] of lines.entries()) {
    await harness.call({
      name: "generate_asset",
      arguments: {
        asset_id: `line-${String(index + 1)}`,
        capability: "speech",
        input: { text },
      },
    });
  }
  const [timeline] = harness.store.read().timelines;
  const row = timeline?.tracks.find((track) => track.id === "main");
  await harness.call({
    name: "set_timeline",
    arguments: {
      output_id: "wide",
      tracks: [
        {
          id: "main",
          kind: "scene",
          clips: (row?.clips ?? []).map((clip) => ({
            id: clip.id,
            scene_id: "sceneId" in clip ? clip.sceneId : "",
            start_frame: clip.startFrame,
            duration_frames: clip.durationFrames,
          })),
        },
        {
          id: "voice",
          kind: "audio",
          clips: [0, 30, 60].map((...[startFrame, index]) => ({
            asset_id: `line-${String(index + 1)}`,
            start_frame: startFrame,
            duration_frames: 15,
          })),
        },
      ],
    },
  });
}

describe("replace_narration over a voice with one clip for each line", () => {
  it("records only the changed line again and puts each line where it started", async () => {
    const harness = await harnessWithThreeScenes({ withVoice: true });
    await voiceForEachLine(harness);
    await harness.call({
      name: "set_script",
      arguments: {
        script: ["Calm tea.", "Hoshi helps you.", "Try it."].join("\n"),
      },
    });

    const result = await harness.call({
      name: "replace_narration",
      arguments: { output_ids: ["wide"] },
    });

    expect(result.isError).toBe(false);
    const snapshot = harness.store.read();
    const voice = snapshot.timelines[0]?.tracks.find(
      (track) => track.id === "voice",
    );
    const placed = (voice?.clips ?? []).map((clip) => {
      const assetId = "assetId" in clip ? clip.assetId : "";
      const asset = snapshot.assets.find(
        (candidate) => candidate.id === assetId,
      );
      return [
        assetId,
        clip.startFrame,
        asset?.source.kind === "tool" ? asset.source.input["text"] : undefined,
      ];
    });
    expect(placed).toEqual([
      ["line-1", 0, "Calm tea."],
      ["voice", 30, "Hoshi helps you."],
      ["line-3", 60, "Try it."],
    ]);
  });
});
