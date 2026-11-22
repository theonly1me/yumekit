import { describe, expect, it } from "vitest";
import { base64Of, callTool, pictureFiles } from "../testing/callTool.ts";
import { resultText } from "../testing/connectGeminiMedia.ts";
import { completedOutput, fakeMp3 } from "../testing/fakeOutputs.ts";

const hundredFrames = fakeMp3({ frameCount: 100 });

function callMusic(options: { arguments: Record<string, unknown> }) {
  return callTool({
    name: "generate_music",
    arguments: {
      prompt: "A short acoustic guitar piece.",
      duration_seconds: 30,
      ...options.arguments,
    },
    respond: completedOutput({
      id: "v1_music",
      type: "audio",
      mimeType: "audio/mpeg",
      bytes: hundredFrames,
    }),
  });
}

describe("generate_music", () => {
  it("sends the documented body of each music model with the default settings", async () => {
    const full = await callMusic({
      arguments: { model: "lyria-3.5", instrumental: true },
    });
    const clip = await callMusic({
      arguments: { model: "lyria-3-clip-preview", instrumental: true },
    });

    expect(full.bodies).toEqual([
      {
        model: "lyria-3.5",
        input:
          "A short acoustic guitar piece. Make it 30 seconds long. Instrumental only, no vocals.",
      },
    ]);
    expect(clip.bodies).toEqual([
      {
        model: "lyria-3-clip-preview",
        input: "A short acoustic guitar piece. Instrumental only, no vocals.",
      },
    ]);
  });

  it("uses Lyria 3.5 with no model and leaves out the instrumental sentence on request", async () => {
    const { bodies } = await callMusic({
      arguments: { duration_seconds: 90, instrumental: false },
    });

    expect(bodies).toEqual([
      {
        model: "lyria-3.5",
        input: "A short acoustic guitar piece. Make it 90 seconds long.",
      },
    ]);
  });

  it("sends the prompt and then each picture for the mood", async () => {
    const paths = await pictureFiles(1);
    const { bodies } = await callMusic({
      arguments: { reference_image_paths: paths },
    });

    expect(bodies).toMatchObject([
      {
        input: [
          { type: "text" },
          {
            type: "image",
            mime_type: "image/png",
            data: base64Of("picture 0"),
          },
        ],
      },
    ]);
  });

  it("writes an MP3 file and reads its length from the MP3 frames", async () => {
    const { result } = await callMusic({ arguments: {} });

    expect(result.structuredContent).toMatchObject({
      files: [{ kind: "audio", duration_seconds: (100 * 1152) / 44100 }],
    });
    expect(resultText(result)).toMatch(/made\.mp3/);
  });

  it("rejects a length that the model cannot make before any request", async () => {
    for (const input of [
      { model: "lyria-3-clip-preview", duration_seconds: 20 },
      { duration_seconds: 5 },
      { duration_seconds: 12.5 },
      { model: "lyria-realtime-exp" },
    ]) {
      const { result, requests } = await callMusic({ arguments: input });
      expect(result.isError, JSON.stringify(input)).toBe(true);
      expect(requests, JSON.stringify(input)).toHaveLength(0);
    }
  });
});
