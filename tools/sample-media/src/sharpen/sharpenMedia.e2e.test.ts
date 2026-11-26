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
  const folder = await mkdtemp(join(tmpdir(), "yumekit-sample-sharper-"));
  const client = new Client({ name: "sample-sharper-test", version: "0.0.0" });
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
  return { folder, call };
}

const resultFiles = z.object({
  files: z.array(
    z.object({
      path: z.string(),
      kind: z.string(),
      width_pixels: z.number().optional(),
      height_pixels: z.number().optional(),
      duration_seconds: z.number().optional(),
    }),
  ),
});

async function probedSizeOf(file: string) {
  const { stdout } = await runFile("ffprobe", [
    ...["-v", "error", "-show_entries", "stream=codec_type,width,height"],
    ...["-of", "json", file],
  ]);
  return z
    .object({
      streams: z.array(
        z.object({
          codec_type: z.string(),
          width: z.number().optional(),
          height: z.number().optional(),
        }),
      ),
    })
    .parse(JSON.parse(stdout)).streams;
}

describe("sample sharpen_media", () => {
  it("writes a real PNG copy of a picture that is twice as wide and tall", async () => {
    const { folder, call } = await connectSample();
    await call({
      name: "generate_image",
      arguments: {
        prompt: "a fox",
        width_pixels: 320,
        height_pixels: 180,
        output_directory: folder,
        file_stem: "fox",
      },
    });

    const result = await call({
      name: "sharpen_media",
      arguments: {
        media_path: join(folder, "fox.png"),
        scale: 2,
        output_directory: folder,
        file_stem: "fox-sharper",
      },
    });

    const [file] = resultFiles.parse(result.structuredContent).files;
    expect(file).toMatchObject({
      path: join(folder, "fox-sharper.png"),
      kind: "image",
      width_pixels: 640,
      height_pixels: 360,
    });
    expect(await probedSizeOf(join(folder, "fox-sharper.png"))).toEqual([
      { codec_type: "video", width: 640, height: 360 },
    ]);
  });

  it("writes an MP4 copy of a video that is four times as wide and tall and keeps the sound", async () => {
    const { folder, call } = await connectSample();
    await call({
      name: "generate_video",
      arguments: {
        prompt: "waves",
        duration_seconds: 1,
        output_directory: folder,
        file_stem: "waves",
      },
    });

    const result = await call({
      name: "sharpen_media",
      arguments: {
        media_path: join(folder, "waves.mp4"),
        scale: 4,
        output_directory: folder,
        file_stem: "waves-sharper",
      },
    });

    expect(result.isError).not.toBe(true);
    const streams = await probedSizeOf(join(folder, "waves-sharper.mp4"));
    expect(streams).toContainEqual({
      codec_type: "video",
      width: 5120,
      height: 2880,
    });
    expect(streams.map((stream) => stream.codec_type)).toContain("audio");
  });

  it("rejects a file that is not a picture or a video", async () => {
    const { folder, call } = await connectSample();

    const result = await call({
      name: "sharpen_media",
      arguments: {
        media_path: join(folder, "notes.txt"),
        scale: 2,
        output_directory: folder,
        file_stem: "notes-sharper",
      },
    });

    expect(result.isError).toBe(true);
    expect(JSON.stringify(result.content)).toContain(
      "is not a PNG, JPEG, or WebP picture",
    );
  });
});
