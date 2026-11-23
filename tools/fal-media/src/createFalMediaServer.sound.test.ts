import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";
import { callFalTool } from "./testing/callFalTool.ts";
import { bodyOf, resultText } from "./testing/connectFalMedia.ts";
import { fakeMp3 } from "./testing/fakeFal.ts";

const elevenLabsQueue = "https://queue.fal.run/elevenlabs/sound-effects/v3";

describe("generate_sound_effect", () => {
  it("makes an MP3 with the default model and a cost from the price for each second", async () => {
    const { result, folder, submits } = await callFalTool({
      name: "generate_sound_effect",
      arguments: () => Promise.resolve({ duration_seconds: 4 }),
    });

    expect(result.isError, resultText(result)).toBeFalsy();
    const [submit] = submits;
    expect(submit?.url).toBe(elevenLabsQueue);
    expect(submit && (await bodyOf(submit))).toEqual({
      text: "A red fox in snow",
      output_format: "mp3_44100_128",
      duration_seconds: 4,
    });
    expect(result.structuredContent).toEqual({
      files: [{ path: `${folder}/fox.mp3`, kind: "audio" }],
      cost_usd: 0.008,
      cost_is_estimate: true,
    });
    expect(await readFile(`${folder}/fox.mp3`)).toEqual(fakeMp3);
  });

  it("lets ElevenLabs pick the length when the call gives none, and then gives no cost", async () => {
    const { result, submits } = await callFalTool({
      name: "generate_sound_effect",
      arguments: () => Promise.resolve({}),
    });

    const [submit] = submits;
    expect(submit && (await bodyOf(submit))).toEqual({
      text: "A red fox in snow",
      output_format: "mp3_44100_128",
    });
    expect(result.structuredContent).not.toHaveProperty("cost_usd");
  });

  it("asks another model for 5 seconds and one sample when the call gives no length", async () => {
    const { submits } = await callFalTool({
      name: "generate_sound_effect",
      arguments: () =>
        Promise.resolve({ model: "mirelo-ai/sfx2.0/text-to-audio" }),
    });

    const [submit] = submits;
    expect(submit && (await bodyOf(submit))).toEqual({
      prompt: "A red fox in snow",
      duration: 5,
      num_samples: 1,
      upload_audio_format: "mp3",
    });
  });

  it("rejects a length that the model does not take, before any request", async () => {
    const { result, media } = await callFalTool({
      name: "generate_sound_effect",
      arguments: () => Promise.resolve({ duration_seconds: 45 }),
    });

    expect(result.isError).toBe(true);
    expect(resultText(result)).toBe(
      "duration_seconds 45 does not fit ElevenLabs Sound Effects 3. It takes 1 to 30 seconds.",
    );
    expect(media.requests).toHaveLength(0);
  });
});
