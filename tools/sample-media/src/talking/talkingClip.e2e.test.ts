import { execFile } from "node:child_process";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { CallToolResultSchema } from "@modelcontextprotocol/sdk/types.js";
import { describe, expect, it, onTestFinished } from "vitest";
import { z } from "zod";

const runFile = promisify(execFile);

async function connectSample() {
  const folder = await mkdtemp(join(tmpdir(), "yumekit-sample-talking-"));
  const client = new Client({ name: "sample-talking-test", version: "0.0.0" });
  await client.connect(
    new StdioClientTransport({
      command: process.execPath,
      args: [fileURLToPath(new URL("../main.ts", import.meta.url))],
    }),
  );
  onTestFinished(async () => {
    await client.close();
    await rm(folder, { recursive: true, force: true });
  });
  const call = async (request: {
    name: string;
    arguments: Record<string, unknown>;
  }) =>
    CallToolResultSchema.parse(
      await client.callTool(request, undefined, { timeout: 60_000 }),
    );
  await call({
    name: "generate_speech",
    arguments: {
      text: "one two three four",
      output_directory: folder,
      file_stem: "voice",
    },
  });
  return { folder, call, voicePath: join(folder, "voice.wav") };
}

const probeOutput = z.object({
  streams: z.array(
    z.object({
      codec_type: z.string(),
      width: z.number().optional(),
      height: z.number().optional(),
    }),
  ),
  format: z.object({ duration: z.string() }),
});

async function probe(file: string) {
  const { stdout } = await runFile("ffprobe", [
    ...["-v", "error", "-show_entries"],
    ...["stream=codec_type,width,height:format=duration", "-of", "json", file],
  ]);
  const parsed = probeOutput.parse(JSON.parse(stdout));
  return {
    streams: parsed.streams.map((stream) => stream.codec_type).toSorted(),
    picture: parsed.streams.find((stream) => stream.codec_type === "video"),
    seconds: Number(parsed.format.duration),
  };
}

const voiceSeconds = 4 * 0.3;

describe("sample generate_talking_clip", () => {
  it("makes an MP4 of a picture with the voice as its sound, as long as the voice", async () => {
    const { folder, call, voicePath } = await connectSample();
    await call({
      name: "generate_image",
      arguments: {
        prompt: "a face",
        width_pixels: 320,
        height_pixels: 240,
        output_directory: folder,
        file_stem: "face",
      },
    });

    const result = await call({
      name: "generate_talking_clip",
      arguments: {
        media_path: join(folder, "face.png"),
        audio_path: voicePath,
        output_directory: folder,
        file_stem: "face-talking",
      },
    });

    expect(result.isError).not.toBe(true);
    expect(result.structuredContent).toMatchObject({
      files: [{ kind: "video", width_pixels: 320, height_pixels: 240 }],
    });
    const made = await probe(join(folder, "face-talking.mp4"));
    expect(made.streams).toEqual(["audio", "video"]);
    expect(made.picture).toMatchObject({ width: 320, height: 240 });
    expect(made.seconds).toBeCloseTo(voiceSeconds, 1);
  });

  it("loops a shorter video until the voice ends", async () => {
    const { folder, call, voicePath } = await connectSample();
    await call({
      name: "generate_video",
      arguments: {
        prompt: "a face",
        duration_seconds: 1,
        with_audio: false,
        output_directory: folder,
        file_stem: "face",
      },
    });

    const result = await call({
      name: "generate_talking_clip",
      arguments: {
        media_path: join(folder, "face.mp4"),
        audio_path: voicePath,
        output_directory: folder,
        file_stem: "face-talking",
      },
    });

    expect(result.isError).not.toBe(true);
    const made = await probe(join(folder, "face-talking.mp4"));
    expect(made.streams).toEqual(["audio", "video"]);
    expect(made.seconds).toBeCloseTo(voiceSeconds, 1);
  });

  it("fails with a clear message when the voice file has no sound", async () => {
    const { folder, call } = await connectSample();
    await call({
      name: "generate_image",
      arguments: { prompt: "a face", output_directory: folder, file_stem: "a" },
    });

    const result = await call({
      name: "generate_talking_clip",
      arguments: {
        media_path: join(folder, "a.png"),
        audio_path: join(folder, "a.png"),
        output_directory: folder,
        file_stem: "a-talking",
      },
    });

    expect(result.isError).toBe(true);
    expect(JSON.stringify(result.content)).toContain(
      "has no sound that FFmpeg can read",
    );
  });
});
