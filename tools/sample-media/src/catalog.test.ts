import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { CallToolResultSchema } from "@modelcontextprotocol/sdk/types.js";
import { describe, expect, it, onTestFinished } from "vitest";
import { sampleDescription } from "./catalog.ts";

const toolByCapability = {
  image: "generate_image",
  speech: "generate_speech",
  align: "align_words",
  music: "generate_music",
  video: "generate_video",
  "sound-effect": "generate_sound_effect",
  sharper: "sharpen_media",
} as const;

async function connectSample() {
  const folder = await mkdtemp(join(tmpdir(), "yumekit-sample-catalog-"));
  const client = new Client({ name: "sample-catalog-test", version: "0.0.0" });
  await client.connect(
    new StdioClientTransport({
      command: process.execPath,
      args: [fileURLToPath(new URL("main.ts", import.meta.url))],
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
      await client.callTool(request, undefined, {
        timeout: 60_000,
      }),
    );
  const speech = await call({
    name: "generate_speech",
    arguments: {
      text: "one two",
      output_directory: folder,
      file_stem: "speech",
    },
  });
  const speechFile = join(folder, "speech.wav");
  const picture = await call({
    name: "generate_image",
    arguments: { prompt: "a fox", output_directory: folder, file_stem: "fox" },
  });
  const required = {
    image: { prompt: "a fox", output_directory: folder, file_stem: "image" },
    speech: { text: "one two", output_directory: folder, file_stem: "voice" },
    align: { audio_path: speechFile, text: "one two" },
    music: {
      prompt: "calm",
      duration_seconds: 1,
      output_directory: folder,
      file_stem: "music",
    },
    video: {
      prompt: "waves",
      duration_seconds: 1,
      output_directory: folder,
      file_stem: "video",
    },
    "sound-effect": {
      prompt: "a door slams",
      output_directory: folder,
      file_stem: "door",
    },
    sharper: {
      media_path: join(folder, "fox.png"),
      scale: 2,
      output_directory: folder,
      file_stem: "fox-sharper",
    },
  } as const;
  return {
    client,
    call,
    required,
    speechWorked: speech.isError !== true && picture.isError !== true,
  };
}

describe("the sample catalog", () => {
  it("returns the catalog from describe_media_server", async () => {
    const { call } = await connectSample();

    const result = await call({
      name: "describe_media_server",
      arguments: {},
    });

    expect(result.structuredContent).toEqual(sampleDescription);
  });

  it("accepts each model id and the default value of each setting", async () => {
    const { call, required, speechWorked } = await connectSample();
    expect(speechWorked).toBe(true);

    for (const model of sampleDescription.models) {
      const tool = toolByCapability[model.capability];
      const base = { ...required[model.capability], model: model.id };
      const plain = await call({ name: tool, arguments: base });
      expect(plain.isError, `${model.id} with no setting`).not.toBe(true);
      for (const setting of model.settings) {
        const result = await call({
          name: tool,
          arguments: { ...base, [setting.name]: setting.default },
        });
        expect(result.isError, `${model.id} ${setting.name}`).not.toBe(true);
      }
    }
  });

  it("rejects an unknown model with the list of ids", async () => {
    const { call, required } = await connectSample();

    const result = await call({
      name: "generate_music",
      arguments: { ...required.music, model: "sample-image" },
    });

    expect(result.isError).toBe(true);
    expect(result.content).toEqual([
      {
        type: "text",
        text: 'Unknown model "sample-image". The music models of this server are: sample-music.',
      },
    ]);
  });
});
