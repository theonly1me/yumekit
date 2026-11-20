import { writeFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  connectOpenAiMedia,
  fakePng,
  fakeWav,
  imageResponse,
  placeholderKey,
  resultText,
  temporaryFolder,
} from "../testing/connectOpenAiMedia.ts";
import { catalogModels, openAiDescription } from "./catalog.ts";

const toolByCapability = {
  image: "generate_image",
  speech: "generate_speech",
  align: "align_words",
} as const;

function respondByEndpoint(request: Request): Promise<Response> {
  if (request.url.endsWith("/audio/speech")) {
    return Promise.resolve(
      new Response(fakeWav({ sampleRate: 24000, sampleCount: 24 })),
    );
  }
  if (request.url.endsWith("/audio/transcriptions")) {
    return Promise.resolve(
      Response.json({ duration: 1, words: [{ word: "Hi", start: 0, end: 1 }] }),
    );
  }
  return imageResponse(fakePng({ width: 16, height: 16 }));
}

async function connectWithKey(environment: NodeJS.ProcessEnv = {}) {
  const folder = await temporaryFolder();
  const audioPath = join(folder, "hello.wav");
  await writeFile(audioPath, fakeWav({ sampleRate: 24000, sampleCount: 24 }));
  const media = await connectOpenAiMedia({
    environment: { OPENAI_API_KEY: placeholderKey, ...environment },
    respond: respondByEndpoint,
  });
  const output = { output_directory: folder, file_stem: "made" };
  const required = {
    image: { prompt: "A lake", ...output },
    speech: { text: "Hi", ...output },
    align: { audio_path: audioPath, text: "Hi" },
  };
  return { media, required };
}

const activeDefaults = {
  image: "gpt-image-2.5-flare",
  speech: "gpt-4o-mini-tts",
  align: "whisper-1",
};

describe("the openai-media catalog", () => {
  it("describes the key and the models with no key and no request", async () => {
    const media = await connectOpenAiMedia({
      environment: {},
      respond: respondByEndpoint,
    });

    const result = await media.callTool({
      name: "describe_media_server",
      arguments: {},
    });

    expect(result.structuredContent).toEqual(openAiDescription(activeDefaults));
    expect(result.structuredContent).toMatchObject({
      keys: [
        {
          variable: "OPENAI_API_KEY",
          get_key_url: "https://platform.openai.com/api-keys",
        },
      ],
    });
    expect(media.requests).toHaveLength(0);
  });

  it("accepts each model id and the default value of each setting", async () => {
    const { media, required } = await connectWithKey();

    for (const model of catalogModels) {
      const tool = toolByCapability[model.capability];
      const base = { ...required[model.capability], model: model.id };
      const plain = await media.callTool({ name: tool, arguments: base });
      expect(resultText(plain), model.id).not.toMatch(/Unknown model/);
      expect(plain.isError, model.id).not.toBe(true);
      for (const setting of model.settings) {
        if (!("default" in setting)) continue;
        const result = await media.callTool({
          name: tool,
          arguments: { ...base, [setting.name]: setting.default },
        });
        expect(result.isError, `${model.id} setting`).not.toBe(true);
      }
    }
  });

  it("rejects an unknown model with the list of ids and sends no request", async () => {
    const { media, required } = await connectWithKey();

    const result = await media.callTool({
      name: "generate_image",
      arguments: { ...required.image, model: "dall-e-2" },
    });

    expect(result.isError).toBe(true);
    expect(resultText(result)).toBe(
      'Unknown model "dall-e-2". The image models of this server are: gpt-image-2.5-flare.',
    );
    expect(media.requests).toHaveLength(0);
  });

  it("makes the model from the environment variable the default and accepts it", async () => {
    const { media, required } = await connectWithKey({
      YUMEKIT_OPENAI_IMAGE_MODEL: "gpt-image-2.6-sunburst",
    });

    const description = await media.callTool({
      name: "describe_media_server",
      arguments: {},
    });
    const result = await media.callTool({
      name: "generate_image",
      arguments: { ...required.image, model: "gpt-image-2.6-sunburst" },
    });

    expect(description.structuredContent).toMatchObject({
      models: [
        { id: "gpt-image-2.5-flare", is_default: false },
        { id: "gpt-image-2.6-sunburst", is_default: true },
        { id: "gpt-4o-mini-tts", is_default: true },
        { id: "whisper-1", is_default: true },
      ],
    });
    expect(result.isError).not.toBe(true);
  });
});
