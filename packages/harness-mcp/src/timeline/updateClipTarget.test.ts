import { describe, expect, it } from "vitest";
import { harnessWithSpeech, timelineOf } from "../testing/narrationFixture.js";

async function harnessWithNarration() {
  const harness = await harnessWithSpeech();
  await harness.call({
    name: "put_scene",
    arguments: {
      scene_id: "outro",
      title: "Outro",
      kit_component: "title-card",
      props: { heading: "Bye" },
    },
  });
  await harness.call({
    name: "generate_asset",
    arguments: {
      asset_id: "line-two",
      capability: "speech",
      input: { text: "five six seven eight nine" },
    },
  });
  const placed = await harness.call({
    name: "place_narration",
    arguments: { output_id: "wide", asset_id: "line-one", start_frame: 0 },
  });
  const audioClipId = placed.data["audio_clip_id"];
  if (typeof audioClipId !== "string") throw new Error("No audio clip id");
  const [sceneClip] = timelineOf(harness).tracks[0]?.clips ?? [];
  if (sceneClip === undefined) throw new Error("No scene clip");
  return { harness, audioClipId, sceneClipId: sceneClip.id };
}

describe("update_clip changes the target of a clip", () => {
  it("shows another scene in the same place with scene_id", async () => {
    const { harness, sceneClipId } = await harnessWithNarration();

    const result = await harness.call({
      name: "update_clip",
      arguments: { output_id: "wide", clip_id: sceneClipId, scene_id: "outro" },
    });

    expect(result.isError).toBe(false);
    expect(timelineOf(harness).tracks[0]?.clips).toEqual([
      expect.objectContaining({
        sceneId: "outro",
        startFrame: 0,
        durationFrames: 90,
      }),
    ]);
  });

  it("plays another audio asset with asset_id", async () => {
    const { harness, audioClipId } = await harnessWithNarration();

    const result = await harness.call({
      name: "update_clip",
      arguments: {
        output_id: "wide",
        clip_id: audioClipId,
        asset_id: "line-two",
      },
    });

    const audioTrack = timelineOf(harness).tracks.find(
      (track) => track.kind === "audio",
    );
    expect(result.isError).toBe(false);
    expect(audioTrack?.clips).toEqual([
      expect.objectContaining({ id: audioClipId, assetId: "line-two" }),
    ]);
  });

  it("returns not-found for a scene that does not exist", async () => {
    const { harness, sceneClipId } = await harnessWithNarration();

    const result = await harness.call({
      name: "update_clip",
      arguments: { output_id: "wide", clip_id: sceneClipId, scene_id: "gone" },
    });

    expect(result.data).toMatchObject({ kind: "not-found" });
    expect(result.data["message"]).toContain("gone");
  });

  it("returns invalid-value for asset_id on a scene clip", async () => {
    const { harness, sceneClipId } = await harnessWithNarration();

    const result = await harness.call({
      name: "update_clip",
      arguments: {
        output_id: "wide",
        clip_id: sceneClipId,
        asset_id: "line-two",
      },
    });

    expect(result.data).toMatchObject({ kind: "invalid-value" });
  });
});
