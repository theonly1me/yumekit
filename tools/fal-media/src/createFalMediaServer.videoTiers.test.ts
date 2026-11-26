import { describe, expect, it } from "vitest";
import { callFalTool } from "./testing/callFalTool.ts";
import { bodyOf, resultText, writeImage } from "./testing/connectFalMedia.ts";
import { fakeFal, fakeMp4, fakeUrls } from "./testing/fakeFal.ts";

const queue = "https://queue.fal.run";

describe("generate_video with the newer fal models and their cheaper tiers", () => {
  it("sends the length of Veo 3.1 as seconds with an s, as its fal schema asks", async () => {
    const { result, submits } = await callFalTool({
      name: "generate_video",
      arguments: () =>
        Promise.resolve({ model: "fal-ai/veo3.1", duration_seconds: 6 }),
    });

    expect(result.isError).toBeFalsy();
    const [submit] = submits;
    expect(submit?.url).toBe(`${queue}/fal-ai/veo3.1`);
    expect(submit && (await bodyOf(submit))).toEqual({
      prompt: "A red fox in snow",
      duration: "6s",
      resolution: "720p",
      generate_audio: true,
      aspect_ratio: "16:9",
    });
  });

  it("sends a first and a last frame of Veo 3.1 Lite to its first and last frame endpoint", async () => {
    const { submits } = await callFalTool({
      name: "generate_video",
      arguments: async (folder) => ({
        model: "fal-ai/veo3.1/lite",
        duration_seconds: 4,
        first_frame_path: await writeImage({ folder, name: "start.png" }),
        last_frame_path: await writeImage({ folder, name: "end.png" }),
      }),
    });

    const [submit] = submits;
    expect(submit?.url).toBe(
      `${queue}/fal-ai/veo3.1/lite/first-last-frame-to-video`,
    );
    expect(submit && (await bodyOf(submit))).toMatchObject({
      first_frame_url: `${fakeUrls.fileUrlPrefix}start.png`,
      last_frame_url: `${fakeUrls.fileUrlPrefix}end.png`,
    });
  });

  it("sends prompt_expansion_mode to MiniMax H3 Max, because its fal schema requires the field", async () => {
    const { submits } = await callFalTool({
      name: "generate_video",
      arguments: () =>
        Promise.resolve({ model: "minimax/h3-max", duration_seconds: 5 }),
    });

    expect(submits[0] && (await bodyOf(submits[0]))).toEqual({
      prompt: "A red fox in snow",
      duration: 5,
      resolution: "768P",
      prompt_expansion_mode: "balanced",
      aspect_ratio: "16:9",
    });
  });

  it("sends reference pictures of Seedance 2.5 Flash to its reference endpoint", async () => {
    const { submits } = await callFalTool({
      name: "generate_video",
      arguments: async (folder) => ({
        model: "bytedance/seedance-2.5/flash",
        duration_seconds: 5,
        reference_image_paths: [await writeImage({ folder, name: "face.png" })],
      }),
    });

    const [submit] = submits;
    expect(submit?.url).toBe(
      `${queue}/bytedance/seedance-2.5/flash/reference-to-video`,
    );
    expect(submit && (await bodyOf(submit))).toMatchObject({
      image_urls: [`${fakeUrls.fileUrlPrefix}face.png`],
      resolution: "720p",
    });
  });

  it.each([
    {
      name: "4 seconds of Veo 3.1 Lite at 720p with sound, as the example of its fal page says",
      input: { model: "fal-ai/veo3.1/lite", duration_seconds: 4 },
      usd: 0.2,
    },
    {
      name: "4 seconds of Veo 3.1 Lite at 720p with no sound",
      input: {
        model: "fal-ai/veo3.1/lite",
        duration_seconds: 4,
        with_audio: false,
      },
      usd: 0.12,
    },
    {
      name: "10 seconds of FLUX 3 Max at 720p at its regular price, not the sale price that ends on 2026-12-07",
      input: {
        model: "blackforestlabs/flux-3-max/video",
        duration_seconds: 10,
      },
      usd: 1.7,
    },
    {
      name: "5 seconds of MiniMax H3 Max Turbo at 768P",
      input: { model: "minimax/h3-max-turbo", duration_seconds: 5 },
      usd: 0.2,
    },
  ])("estimates $name", async ({ input, usd }) => {
    const video = fakeMp4({
      widthPixels: 1280,
      heightPixels: 720,
      durationSeconds: input.duration_seconds,
    });
    const { result } = await callFalTool({
      name: "generate_video",
      arguments: () => Promise.resolve(input),
      respond: fakeFal({ video }),
    });

    expect(result.structuredContent).toMatchObject({
      cost_usd: usd,
      cost_is_estimate: true,
    });
  });

  it.each([
    {
      name: "a last frame for Kling 4 Flash",
      input: {
        model: "kling/v4/flash",
        duration_seconds: 5,
        first_frame_path: "/tmp/a.png",
        last_frame_path: "/tmp/b.png",
      },
      message: "Kling 4 Flash does not accept last_frame_path.",
    },
    {
      name: "a length that Veo 3.1 does not offer",
      input: { model: "fal-ai/veo3.1", duration_seconds: 5 },
      message: "duration_seconds must be one of 4, 6, 8 for Veo 3.1.",
    },
    {
      name: "1080p for Seedance 2.5 Flash",
      input: {
        model: "bytedance/seedance-2.5/flash",
        duration_seconds: 5,
        resolution: "1080p",
      },
      message: "resolution must be one of 480p, 720p for Seedance 2.5 Flash.",
    },
    {
      name: "no sound for Happy Horse 1.1, which always makes sound",
      input: {
        model: "alibaba/happy-horse/v1.1",
        duration_seconds: 5,
        with_audio: false,
      },
      message:
        "Happy Horse 1.1 always makes sound. To leave the sound out, place the clip with sound_gain_decibels set to off.",
    },
    {
      name: "reference pictures for MiniMax H3 Max Turbo, whose reference endpoint has another price",
      input: {
        model: "minimax/h3-max-turbo",
        duration_seconds: 5,
        reference_image_paths: ["/tmp/a.png"],
      },
      message:
        "MiniMax H3 Max Turbo does not accept reference_image_paths. Give first_frame_path and last_frame_path in their place.",
    },
  ])("rejects $name before any request", async (rejected) => {
    const { result, media } = await callFalTool({
      name: "generate_video",
      arguments: () => Promise.resolve(rejected.input),
    });

    expect(result.isError).toBe(true);
    expect(resultText(result)).toBe(rejected.message);
    expect(media.requests).toHaveLength(0);
  });
});
