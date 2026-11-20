import { execFile } from "node:child_process";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { describe, expect, it, onTestFinished } from "vitest";
import { z } from "zod";
import { promptColor } from "../image/drawPromptImage.ts";
import { ffmpegMissingMessage } from "./encodeVideo.ts";

const runFile = promisify(execFile);

async function sampleClient(environment?: Record<string, string>) {
  const client = new Client({ name: "sample-video-test", version: "0.0.0" });
  await client.connect(
    new StdioClientTransport({
      command: process.execPath,
      args: [fileURLToPath(new URL("../main.ts", import.meta.url))],
      ...(environment === undefined ? {} : { env: environment }),
    }),
  );
  const outputDirectory = await mkdtemp(join(tmpdir(), "sample-video-"));
  onTestFinished(async () => {
    await client.close();
    await rm(outputDirectory, { recursive: true, force: true });
  });
  return { client, outputDirectory };
}

async function streamsOf(file: string) {
  const { stdout } = await runFile("ffprobe", [
    ...["-v", "error", "-count_frames", "-show_entries"],
    "stream=codec_type,width,height,r_frame_rate,nb_read_frames",
    ...["-of", "json", file],
  ]);
  return z
    .object({ streams: z.array(z.record(z.string(), z.unknown())) })
    .parse(JSON.parse(stdout)).streams;
}

async function pixelOf(options: { file: string; frame: number; x: number }) {
  const { stdout } = await runFile(
    "ffmpeg",
    [
      ...["-v", "error", "-i", options.file, "-vf"],
      `select=eq(n\\,${String(options.frame)}),crop=2:2:${String(options.x)}:360`,
      ...["-frames:v", "1", "-f", "rawvideo", "-pix_fmt", "rgb24", "pipe:1"],
    ],
    { encoding: "buffer" },
  );
  return [...stdout.subarray(0, 3)];
}

describe("sample generate_video", () => {
  it("writes a wide 24 frames per second MP4 of the requested length with sound", async () => {
    const { client, outputDirectory } = await sampleClient();

    const result = await client.callTool({
      name: "generate_video",
      arguments: {
        prompt: "a fox in snow",
        duration_seconds: 2,
        output_directory: outputDirectory,
        file_stem: "fox",
      },
    });

    const file = join(outputDirectory, "fox.mp4");
    expect(result.structuredContent).toEqual({
      files: [
        {
          path: file,
          kind: "video",
          width_pixels: 1280,
          height_pixels: 720,
          duration_seconds: 2,
        },
      ],
    });
    const streams = await streamsOf(file);
    expect(streams).toContainEqual({
      codec_type: "video",
      width: 1280,
      height: 720,
      r_frame_rate: "24/1",
      nb_read_frames: "48",
    });
    expect(streams.map((stream) => stream["codec_type"])).toContain("audio");
  });

  it("writes a tall MP4 with no audio stream when with_audio is false", async () => {
    const { client, outputDirectory } = await sampleClient();

    await client.callTool({
      name: "generate_video",
      arguments: {
        prompt: "a tall tower",
        duration_seconds: 1.5,
        width_pixels: 1080,
        height_pixels: 1920,
        with_audio: false,
        output_directory: outputDirectory,
        file_stem: "tower",
      },
    });

    const streams = await streamsOf(join(outputDirectory, "tower.mp4"));
    expect(streams).toEqual([
      {
        codec_type: "video",
        width: 720,
        height: 1280,
        r_frame_rate: "24/1",
        nb_read_frames: "36",
      },
    ]);
  });

  it("fills the frame with the prompt color and changes the counter at the center", async () => {
    const { client, outputDirectory } = await sampleClient();
    await client.callTool({
      name: "generate_video",
      arguments: {
        prompt: "a fox in snow",
        duration_seconds: 1,
        output_directory: outputDirectory,
        file_stem: "fox",
      },
    });
    const file = join(outputDirectory, "fox.mp4");
    const { red, green, blue } = promptColor("a fox in snow");

    const edge = await pixelOf({ file, frame: 0, x: 4 });
    const centerOfFrames = await Promise.all(
      [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((frame) =>
        pixelOf({ file, frame, x: 640 }),
      ),
    );

    const [edgeRed = 0, edgeGreen = 0, edgeBlue = 0] = edge;
    expect(Math.abs(edgeRed - red)).toBeLessThan(12);
    expect(Math.abs(edgeGreen - green)).toBeLessThan(12);
    expect(Math.abs(edgeBlue - blue)).toBeLessThan(12);
    expect(new Set(centerOfFrames.map(String)).size).toBeGreaterThan(1);
  });

  it("returns a failure that names FFmpeg when FFmpeg is not installed", async () => {
    const { client, outputDirectory } = await sampleClient({ PATH: "" });

    const result = await client.callTool({
      name: "generate_video",
      arguments: {
        prompt: "a fox",
        duration_seconds: 1,
        output_directory: outputDirectory,
        file_stem: "fox",
      },
    });

    expect(result.isError).toBe(true);
    expect(result.content).toEqual([
      { type: "text", text: ffmpegMissingMessage },
    ]);
  });
});
