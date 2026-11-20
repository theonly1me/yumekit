import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  connectOpenAiMedia,
  errorResponse,
  fakeWav,
  placeholderKey,
  resultText,
  temporaryFolder,
} from "./testing/connectOpenAiMedia.ts";

const speechSampleRate = 24000;
const oneAndAHalfSeconds = 36000;

async function callSpeech(options: {
  environment: NodeJS.ProcessEnv;
  respond: (request: Request) => Promise<Response>;
  arguments: Record<string, unknown>;
}) {
  const folder = await temporaryFolder();
  const media = await connectOpenAiMedia(options);
  const result = await media.callTool({
    name: "generate_speech",
    arguments: {
      text: "Hello from yumekit.",
      output_directory: join(folder, "assets"),
      file_stem: "hello",
      ...options.arguments,
    },
  });
  return { result, folder, requests: media.requests };
}

const wavResponse = (wav: Buffer) => () =>
  Promise.resolve(new Response(wav, { status: 200 }));

describe("generate_speech", () => {
  it("writes the WAV inside output_directory with its length in seconds and no words", async () => {
    const wav = fakeWav({
      sampleRate: speechSampleRate,
      sampleCount: oneAndAHalfSeconds,
    });
    const { result, folder } = await callSpeech({
      environment: { OPENAI_API_KEY: placeholderKey },
      respond: wavResponse(wav),
      arguments: {},
    });

    const path = join(folder, "assets", "hello.wav");
    expect(result.isError).toBeFalsy();
    expect(result.structuredContent).toEqual({
      files: [{ path, kind: "audio", duration_seconds: 1.5 }],
    });
    expect(await readFile(path)).toEqual(wav);
  });

  it("reads the length from the bytes present when a streamed WAV declares an unknown data length", async () => {
    const { result } = await callSpeech({
      environment: { OPENAI_API_KEY: placeholderKey },
      respond: wavResponse(
        fakeWav({
          sampleRate: speechSampleRate,
          sampleCount: oneAndAHalfSeconds,
          declaredDataBytes: 0xffffffff,
        }),
      ),
      arguments: {},
    });

    expect(result.structuredContent).toMatchObject({
      files: [{ duration_seconds: 1.5 }],
    });
  });

  it("sends the text, the default model, the voice, and WAV output to the speech endpoint", async () => {
    const { requests } = await callSpeech({
      environment: { OPENAI_API_KEY: placeholderKey },
      respond: wavResponse(fakeWav({ sampleRate: 24000, sampleCount: 24 })),
      arguments: {},
    });

    const [request] = requests;
    expect(request?.url).toBe("https://api.openai.com/v1/audio/speech");
    expect(request?.headers.get("authorization")).toBe(
      `Bearer ${placeholderKey}`,
    );
    expect(await request?.json()).toEqual({
      model: "gpt-4o-mini-tts",
      input: "Hello from yumekit.",
      voice: "marin",
      response_format: "wav",
    });
  });

  it("passes voice, instructions, and speed, and the model from YUMEKIT_OPENAI_SPEECH_MODEL", async () => {
    const { requests } = await callSpeech({
      environment: {
        OPENAI_API_KEY: placeholderKey,
        YUMEKIT_OPENAI_SPEECH_MODEL: "gpt-4o-mini-tts-2025-12-15",
      },
      respond: wavResponse(fakeWav({ sampleRate: 24000, sampleCount: 24 })),
      arguments: { voice: "cedar", instructions: "Speak warmly.", speed: 1.25 },
    });

    expect(await requests[0]?.json()).toEqual({
      model: "gpt-4o-mini-tts-2025-12-15",
      input: "Hello from yumekit.",
      voice: "cedar",
      instructions: "Speak warmly.",
      speed: 1.25,
      response_format: "wav",
    });
  });

  it("tells the user to set OPENAI_API_KEY and sends no request when the key is missing", async () => {
    const { result, requests } = await callSpeech({
      environment: {},
      respond: wavResponse(fakeWav({ sampleRate: 24000, sampleCount: 24 })),
      arguments: {},
    });

    expect(result.isError).toBe(true);
    expect(resultText(result)).toContain("OPENAI_API_KEY is not set");
    expect(resultText(result)).toContain("passEnvironment");
    expect(requests).toHaveLength(0);
  });

  it("returns the status and the message of an API error and writes no file", async () => {
    const { result, folder } = await callSpeech({
      environment: { OPENAI_API_KEY: placeholderKey },
      respond: () =>
        errorResponse({ status: 429, message: "You exceeded your quota" }),
      arguments: {},
    });

    expect(result.isError).toBe(true);
    expect(resultText(result)).toBe(
      "The OpenAI API answered 429: You exceeded your quota",
    );
    expect(await readdir(folder)).toEqual([]);
  });
});
