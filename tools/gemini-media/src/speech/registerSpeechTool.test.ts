import { describe, expect, it } from "vitest";
import { callTool } from "../testing/callTool.ts";
import { completedOutput, fakeWav } from "../testing/fakeOutputs.ts";

const twoSecondsAt24000 = fakeWav({ sampleRate: 24000, sampleCount: 48000 });

function callSpeech(options: { arguments: Record<string, unknown> }) {
  return callTool({
    name: "generate_speech",
    arguments: { text: "Have a wonderful day!", ...options.arguments },
    respond: completedOutput({
      id: "v1_voice",
      type: "audio",
      mimeType: "audio/wav",
      bytes: twoSecondsAt24000,
    }),
  });
}

function documentedBody(model: string) {
  return {
    model,
    input: [
      {
        type: "user_input",
        content: [{ type: "text", text: "Have a wonderful day!" }],
      },
    ],
    response_format: { type: "audio" },
    generation_config: { speech_config: [{ voice: "Kore" }] },
  };
}

describe("generate_speech", () => {
  it("sends the documented body of each voice model with the default voice", async () => {
    for (const model of ["gemini-3.8-flash-tts", "gemini-3.8-flash-lite-tts"]) {
      const { bodies } = await callSpeech({
        arguments: { model, voice: "Kore" },
      });
      expect(bodies, model).toEqual([documentedBody(model)]);
    }
    const plain = await callSpeech({ arguments: {} });
    expect(plain.bodies).toEqual([documentedBody("gemini-3.8-flash-tts")]);
  });

  it("sends instructions as the style of the words and the picked voice", async () => {
    const { bodies } = await callSpeech({
      arguments: { voice: "Puck", instructions: "cheerful and friendly" },
    });

    expect(bodies).toMatchObject([
      {
        input: [
          {
            content: [
              {
                annotations: [
                  { type: "speech_metadata", style: "cheerful and friendly" },
                ],
              },
            ],
          },
        ],
        generation_config: { speech_config: [{ voice: "Puck" }] },
      },
    ]);
  });

  it("writes a WAV file with its length and a cost from the price for each second", async () => {
    const flash = await callSpeech({ arguments: {} });
    const lite = await callSpeech({
      arguments: { model: "gemini-3.8-flash-lite-tts" },
    });

    expect(flash.result.structuredContent).toMatchObject({
      files: [{ kind: "audio", duration_seconds: 2 }],
      cost_usd: 0.00045,
      cost_is_estimate: true,
    });
    expect(lite.result.structuredContent).toMatchObject({ cost_usd: 0.0003 });
  });

  it("rejects a speed, an unknown voice, and an unknown model before any request", async () => {
    for (const input of [
      { speed: 1.2 },
      { voice: "marin" },
      { model: "gemini-2.5-flash-preview-tts" },
    ]) {
      const { result, requests } = await callSpeech({ arguments: input });
      expect(result.isError, JSON.stringify(input)).toBe(true);
      expect(requests, JSON.stringify(input)).toHaveLength(0);
    }
  });
});
