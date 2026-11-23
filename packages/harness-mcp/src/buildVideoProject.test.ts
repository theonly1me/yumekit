import { execFile } from "node:child_process";
import { createHash } from "node:crypto";
import { promisify } from "node:util";
import { describe, expect, it } from "vitest";
import { startHarness, type Harness } from "./testing/harnessFixture.js";
import { probeVideo } from "./testing/probeVideo.js";

const runFile = promisify(execFile);

async function succeed(options: {
  harness: Harness;
  name: string;
  arguments?: Record<string, unknown>;
}) {
  const call = await options.harness.call(options);
  if (call.isError) throw new Error(`${options.name} failed: ${call.text}`);
  return call;
}

function colorOfPrompt(prompt: string): number[] {
  return [...createHash("sha256").update(prompt).digest().subarray(0, 3)];
}

async function cornerPixelOf(options: { file: string; frame: number }) {
  const { stdout } = await runFile(
    "ffmpeg",
    [
      ...["-v", "error", "-i", options.file, "-vf"],
      `select=eq(n\\,${String(options.frame)}),crop=2:2:4:4`,
      ...["-frames:v", "1", "-f", "rawvideo", "-pix_fmt", "rgb24", "pipe:1"],
    ],
    { encoding: "buffer" },
  );
  return [...stdout.subarray(0, 3)];
}

function expectNear(options: { actual: number[]; expected: number[] }) {
  for (const [channel, expected] of options.expected.entries()) {
    expect(Math.abs((options.actual[channel] ?? 0) - expected)).toBeLessThan(
      24,
    );
  }
}

const clipPrompts = { first: "a red kite", second: "a slow river" } as const;

describe("a 10 second video with generated clips, built with tool calls only", () => {
  it("renders two clips from still images with narration", async () => {
    const harness = await startHarness({
      outputs: [
        { id: "wide", label: "Wide", widthPixels: 640, heightPixels: 360 },
      ],
    });
    const step = (call: {
      name: string;
      arguments?: Record<string, unknown>;
    }) => succeed({ harness, ...call });

    for (const [assetId, prompt] of Object.entries(clipPrompts)) {
      await step({
        name: "generate_asset",
        arguments: {
          asset_id: `${assetId}-still`,
          capability: "image",
          input: { prompt, width_pixels: 640, height_pixels: 360 },
        },
      });
      await step({
        name: "generate_asset",
        arguments: {
          asset_id: assetId,
          capability: "video",
          input: { prompt, duration_seconds: 5 },
          first_frame_asset_id: `${assetId}-still`,
        },
      });
    }
    await step({
      name: "generate_asset",
      arguments: {
        asset_id: "voice",
        capability: "speech",
        input: { text: "a kite flies over a slow river all day long" },
      },
    });
    const first = await step({
      name: "place_video",
      arguments: { output_id: "wide", asset_id: "first", start_frame: 0 },
    });
    await step({
      name: "place_video",
      arguments: {
        output_id: "wide",
        asset_id: "second",
        start_frame: Number(first.data["end_frame"]),
      },
    });
    await step({
      name: "place_narration",
      arguments: {
        output_id: "wide",
        asset_id: "voice",
        start_frame: 0,
        with_captions: true,
        partial: true,
      },
    });

    const video = await step({
      name: "render_video",
      arguments: { output_id: "wide", scale: 0.25 },
    });

    expect(video.data).toMatchObject({
      frame_count: 300,
      duration_seconds: 10,
    });
    const file = String(video.data["file"]);
    expect(await probeVideo(file)).toEqual([
      expect.objectContaining({
        codec_type: "video",
        width: 160,
        height: 90,
        nb_read_frames: "300",
      }),
      expect.objectContaining({ codec_type: "audio", codec_name: "aac" }),
    ]);
    expectNear({
      actual: await cornerPixelOf({ file, frame: 60 }),
      expected: colorOfPrompt(clipPrompts.first),
    });
    expectNear({
      actual: await cornerPixelOf({ file, frame: 240 }),
      expected: colorOfPrompt(clipPrompts.second),
    });
  }, 300_000);
});
