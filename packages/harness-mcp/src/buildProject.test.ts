import { describe, expect, it } from "vitest";
import { counterExample } from "./sceneGuide/examples.js";
import { startHarness, type Harness } from "./testing/harnessFixture.js";
import { probeVideo } from "./testing/probeVideo.js";

async function succeed(options: {
  harness: Harness;
  name: string;
  arguments?: Record<string, unknown>;
}) {
  const call = await options.harness.call(options);
  if (call.isError) throw new Error(`${options.name} failed: ${call.text}`);
  return call;
}

describe("a small project built with tool calls only", () => {
  it("renders a video with pictures and narration", async () => {
    const harness = await startHarness({
      outputs: [
        { id: "wide", label: "Wide", widthPixels: 640, heightPixels: 360 },
      ],
    });
    const step = (call: {
      name: string;
      arguments?: Record<string, unknown>;
    }) => succeed({ harness, ...call });

    await step({ name: "get_project" });
    await step({
      name: "set_script",
      arguments: { script: "Hello. We made many videos." },
    });
    await step({
      name: "set_bible",
      arguments: {
        style: "paper",
        palette: ["#eef1f4", "#18203a"],
        voice: "calm",
      },
    });
    await step({
      name: "put_scene",
      arguments: {
        scene_id: "hello",
        title: "Hello",
        kit_component: "title-card",
        props: { heading: "Hello" },
      },
    });
    await step({
      name: "put_scene",
      arguments: {
        scene_id: "count",
        title: "Count",
        code: counterExample.code,
        props: counterExample.props,
      },
    });
    const speech = await step({
      name: "generate_asset",
      arguments: {
        asset_id: "voice",
        capability: "speech",
        input: { text: "hello we made many videos" },
      },
    });
    expect(speech.data).toMatchObject({ duration_frames: 45, has_words: true });
    await step({
      name: "set_timeline",
      arguments: {
        output_id: "wide",
        tracks: [
          {
            id: "main",
            kind: "scene",
            clips: [
              { scene_id: "hello", start_frame: 0, duration_frames: 15 },
              { scene_id: "count", start_frame: 15, duration_frames: 30 },
            ],
          },
        ],
      },
    });
    await step({
      name: "place_narration",
      arguments: {
        output_id: "wide",
        asset_id: "voice",
        start_frame: 0,
        with_captions: true,
      },
    });
    const preview = await step({
      name: "preview_frames",
      arguments: {
        output_id: "wide",
        frames: [5, 30],
      },
    });
    expect(preview.data).toMatchObject({
      pictures: [
        { frame: 5, width_pixels: 160, height_pixels: 90 },
        { frame: 30, width_pixels: 160, height_pixels: 90 },
      ],
    });

    const video = await step({
      name: "render_video",
      arguments: {
        output_id: "wide",
        frame_count: 30,
        scale: 0.25,
      },
    });

    expect(video.data).toMatchObject({ frame_count: 30, duration_seconds: 1 });
    const file = String(video.data["file"]);
    expect(await probeVideo(file)).toEqual([
      expect.objectContaining({
        codec_type: "video",
        width: 160,
        height: 90,
        r_frame_rate: "30/1",
        nb_read_frames: "30",
      }),
      expect.objectContaining({ codec_type: "audio", codec_name: "aac" }),
    ]);
  }, 180_000);
});
