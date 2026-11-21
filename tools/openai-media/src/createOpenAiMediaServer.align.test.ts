import { writeFile } from "node:fs/promises";
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

const verboseTranscription = {
  task: "transcribe",
  language: "english",
  duration: 1.5,
  text: "Hello from yumekit.",
  words: [
    { word: "Hello", start: 0, end: 0.42 },
    { word: "from", start: 0.42, end: 0.7 },
    { word: "yumekit", start: 0.7, end: 1.36 },
  ],
  usage: { type: "duration", seconds: 2 },
};

async function callAlign(options: {
  environment: NodeJS.ProcessEnv;
  respond: (request: Request) => Promise<Response>;
  arguments?: Record<string, unknown>;
}) {
  const folder = await temporaryFolder();
  const audioPath = join(folder, "hello.wav");
  await writeFile(audioPath, fakeWav({ sampleRate: 24000, sampleCount: 24 }));
  const media = await connectOpenAiMedia(options);
  const result = await media.callTool({
    name: "align_words",
    arguments: {
      audio_path: audioPath,
      text: "Hello from yumekit.",
      ...options.arguments,
    },
  });
  return { result, requests: media.requests };
}

const transcriptionResponse = (body: object) => () =>
  Promise.resolve(Response.json(body));

describe("align_words", () => {
  it("converts the word timestamps of the API to the convention shape, estimates the cost, and writes no file", async () => {
    const { result } = await callAlign({
      environment: { OPENAI_API_KEY: placeholderKey },
      respond: transcriptionResponse(verboseTranscription),
    });

    expect(result.isError).toBeFalsy();
    expect(result.structuredContent).toMatchObject({
      files: [],
      words: [
        { text: "Hello", start_seconds: 0, end_seconds: 0.42 },
        { text: "from", start_seconds: 0.42, end_seconds: 0.7 },
        { text: "yumekit", start_seconds: 0.7, end_seconds: 1.36 },
      ],
      cost_is_estimate: true,
    });
    expect(result.structuredContent?.["cost_usd"]).toBeCloseTo(0.00015, 10);
  });

  it("asks whisper-1 for verbose JSON with word timestamps and the language", async () => {
    const { requests } = await callAlign({
      environment: { OPENAI_API_KEY: placeholderKey },
      respond: transcriptionResponse(verboseTranscription),
      arguments: { language: "en" },
    });

    const [request] = requests;
    expect(request?.url).toBe("https://api.openai.com/v1/audio/transcriptions");
    const body = (await request?.text()) ?? "";
    expect(body).toContain('name="model"\r\n\r\nwhisper-1\r\n');
    expect(body).toContain('name="response_format"\r\n\r\nverbose_json\r\n');
    expect(body).toContain('name="timestamp_granularities[]"\r\n\r\nword\r\n');
    expect(body).toContain('name="language"\r\n\r\nen\r\n');
    expect(body).toContain('name="file"; filename="hello.wav"');
  });

  it("names YUMEKIT_OPENAI_ALIGN_MODEL when the model returns no word timestamps", async () => {
    const { result } = await callAlign({
      environment: {
        OPENAI_API_KEY: placeholderKey,
        YUMEKIT_OPENAI_ALIGN_MODEL: "gpt-transcribe",
      },
      respond: transcriptionResponse({ text: "Hello from yumekit." }),
    });

    expect(result.isError).toBe(true);
    expect(resultText(result)).toBe(
      "The OpenAI model gpt-transcribe returned no word timestamps. Set YUMEKIT_OPENAI_ALIGN_MODEL to a model that gives them, such as whisper-1.",
    );
  });

  it("tells the user to set OPENAI_API_KEY and sends no request when the key is missing", async () => {
    const { result, requests } = await callAlign({
      environment: {},
      respond: transcriptionResponse(verboseTranscription),
    });

    expect(result.isError).toBe(true);
    expect(resultText(result)).toContain("OPENAI_API_KEY is not set");
    expect(requests).toHaveLength(0);
  });

  it("returns the status and the message of an API error", async () => {
    const { result } = await callAlign({
      environment: { OPENAI_API_KEY: placeholderKey },
      respond: () =>
        errorResponse({ status: 400, message: "Invalid file format." }),
    });

    expect(result.isError).toBe(true);
    expect(resultText(result)).toBe(
      "The OpenAI API answered 400: Invalid file format.",
    );
  });

  it("rejects an audio type that the API does not accept before any request", async () => {
    const { result, requests } = await callAlign({
      environment: { OPENAI_API_KEY: placeholderKey },
      respond: transcriptionResponse(verboseTranscription),
      arguments: { audio_path: "/tmp/notes.txt" },
    });

    expect(resultText(result)).toBe(
      "/tmp/notes.txt must be a flac, m4a, mp3, mp4, mpeg, mpga, ogg, wav, or webm file.",
    );
    expect(requests).toHaveLength(0);
  });
});
