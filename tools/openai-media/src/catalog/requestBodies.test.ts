import { describe, expect, it } from "vitest";
import {
  connectOpenAiMedia,
  fakePng,
  fakeWav,
  imageResponse,
  placeholderKey,
  temporaryFolder,
} from "../testing/connectOpenAiMedia.ts";
import { catalogEntries } from "./catalog.ts";

function respond(request: Request): Promise<Response> {
  if (request.url.endsWith("/audio/speech")) {
    return Promise.resolve(
      new Response(fakeWav({ sampleRate: 24000, sampleCount: 24 })),
    );
  }
  return imageResponse(fakePng({ width: 16, height: 16 }));
}

async function sentBody(options: {
  tool: string;
  arguments: Record<string, unknown>;
}) {
  const media = await connectOpenAiMedia({
    environment: { OPENAI_API_KEY: placeholderKey },
    respond,
  });
  const result = await media.callTool({
    name: options.tool,
    arguments: {
      output_directory: await temporaryFolder(),
      file_stem: "made",
      ...options.arguments,
    },
  });
  const [request] = media.requests;
  const body: unknown = await request?.json();
  return { result, url: request?.url, body };
}

describe("the request body of each openai-media model", () => {
  it("names the page of the OpenAI API documents that each model entry comes from", () => {
    for (const entry of catalogEntries) {
      expect(entry.sourceUrl, entry.model.id).toMatch(
        /^https:\/\/developers\.openai\.com\/api\/docs\/(models|guides)\/[a-z0-9.-]+$/,
      );
    }
  });

  it("sends the documented image body for each picture model with the default settings", async () => {
    const pictureModels = [
      "gpt-image-2.5-flare",
      "gpt-image-2.5-sunburst",
      "gpt-image-2.6-flare",
      "gpt-image-2.6-sunburst",
    ];
    for (const model of pictureModels) {
      const sent = await sentBody({
        tool: "generate_image",
        arguments: { prompt: "A lake", model, transparent_background: false },
      });
      expect(sent.url, model).toBe(
        "https://api.openai.com/v1/images/generations",
      );
      expect(sent.body, model).toEqual({
        model,
        prompt: "A lake",
        size: "auto",
        background: "auto",
        output_format: "png",
        n: 1,
      });
    }
  });

  it("sends the documented speech body for each voice model with its default voice", async () => {
    const defaultVoices = [
      { model: "gpt-4o-mini-tts", voice: "marin" },
      { model: "tts-1", voice: "alloy" },
      { model: "tts-1-hd", voice: "alloy" },
    ];
    for (const { model, voice } of defaultVoices) {
      const sent = await sentBody({
        tool: "generate_speech",
        arguments: { text: "Hello there", model, voice },
      });
      const plain = await sentBody({
        tool: "generate_speech",
        arguments: { text: "Hello there", model },
      });
      const expected = {
        model,
        input: "Hello there",
        voice,
        response_format: "wav",
      };
      expect(sent.url, model).toBe("https://api.openai.com/v1/audio/speech");
      expect(sent.body, model).toEqual(expected);
      expect(plain.body, model).toEqual(expected);
    }
  });

  it("estimates the cost of tts-1 and tts-1-hd from the price for each thousand characters", async () => {
    const tenCharacters = "Hello you!";
    const classic = await sentBody({
      tool: "generate_speech",
      arguments: { text: tenCharacters, model: "tts-1" },
    });
    const hd = await sentBody({
      tool: "generate_speech",
      arguments: { text: tenCharacters, model: "tts-1-hd" },
    });

    expect(classic.result.structuredContent).toMatchObject({
      cost_usd: 0.00015,
      cost_is_estimate: true,
    });
    expect(hd.result.structuredContent).toMatchObject({ cost_usd: 0.0003 });
  });

  it("rejects a voice or instructions that tts-1 does not take, before any request", async () => {
    for (const input of [
      { model: "tts-1", voice: "marin" },
      { model: "tts-1-hd", instructions: "Speak slowly" },
    ]) {
      const sent = await sentBody({
        tool: "generate_speech",
        arguments: { text: "Hello there", ...input },
      });
      expect(sent.result.isError, JSON.stringify(input)).toBe(true);
      expect(sent.url, JSON.stringify(input)).toBeUndefined();
    }
  });
});
