import { describe, expect, it } from "vitest";
import { callFalTool } from "./testing/callFalTool.ts";
import { bodyOf, resultText, writeImage } from "./testing/connectFalMedia.ts";
import { fakeUrls } from "./testing/fakeFal.ts";

const queue = "https://queue.fal.run";

describe("generate_video with the other fal models", () => {
  it("sends reference pictures to the reference endpoint of Gemini Omni Flash", async () => {
    const { result, submits } = await callFalTool({
      name: "generate_video",
      arguments: async (folder) => ({
        model: "google/gemini-omni-flash/v1.2",
        duration_seconds: 8,
        reference_image_paths: [await writeImage({ folder, name: "face.png" })],
      }),
    });

    expect(result.isError).toBeFalsy();
    const [submit] = submits;
    expect(submit?.url).toBe(
      `${queue}/google/gemini-omni-flash/v1.2/reference-to-video`,
    );
    expect(submit && (await bodyOf(submit))).toEqual({
      prompt: "A red fox in snow",
      duration: 8,
      resolution: "720p",
      aspect_ratio: "16:9",
      image_urls: [`${fakeUrls.fileUrlPrefix}face.png`],
    });
  });

  it("sends a first and a last frame of FLUX 3 to its first and last frame endpoint", async () => {
    const { submits } = await callFalTool({
      name: "generate_video",
      arguments: async (folder) => ({
        model: "blackforestlabs/flux-3/video",
        duration_seconds: 5,
        first_frame_path: await writeImage({ folder, name: "start.png" }),
        last_frame_path: await writeImage({ folder, name: "end.png" }),
      }),
    });

    const [submit] = submits;
    expect(submit?.url).toBe(
      `${queue}/blackforestlabs/flux-3/first-last-frame-to-video`,
    );
    expect(submit && (await bodyOf(submit))).toMatchObject({
      start_image_url: `${fakeUrls.fileUrlPrefix}start.png`,
      end_image_url: `${fakeUrls.fileUrlPrefix}end.png`,
    });
  });

  it.each([
    { withAudio: true, usd: 0.3 },
    { withAudio: false, usd: 0.225 },
  ])(
    "estimates $usd US dollars for 5 seconds of PixVerse 6 at 720p with sound $withAudio, as the fal page example says",
    async ({ withAudio, usd }) => {
      const { result, submits } = await callFalTool({
        name: "generate_video",
        arguments: () =>
          Promise.resolve({
            model: "fal-ai/pixverse/v6",
            duration_seconds: 5,
            with_audio: withAudio,
          }),
      });

      expect(submits[0] && (await bodyOf(submits[0]))).toMatchObject({
        generate_audio_switch: withAudio,
      });
      expect(result.structuredContent).toMatchObject({ cost_usd: usd });
    },
  );

  it.each([
    {
      name: "a sound setting for Kling 4, which has none",
      input: { model: "kling/v4", duration_seconds: 5, with_audio: true },
      message: "Kling 4 has no sound setting on fal. Leave out with_audio.",
    },
    {
      name: "no sound for a model that always makes sound",
      input: { model: "minimax/h3", duration_seconds: 5, with_audio: false },
      message:
        "MiniMax H3 always makes sound. To leave the sound out, place the clip with sound_gain_decibels set to off.",
    },
    {
      name: "a length that LTX 2.5 Pro does not offer",
      input: { model: "lightricks/ltx-2.5/pro", duration_seconds: 7 },
      message: "duration_seconds must be one of 6, 8, 10 for LTX 2.5 Pro.",
    },
    {
      name: "a last frame for PixVerse 6",
      input: {
        model: "fal-ai/pixverse/v6",
        duration_seconds: 5,
        first_frame_path: "/tmp/a.png",
        last_frame_path: "/tmp/b.png",
      },
      message: "PixVerse 6 does not accept last_frame_path.",
    },
    {
      name: "a last frame of Gemini Omni Flash above 10 seconds",
      input: {
        model: "google/gemini-omni-flash/v1.2",
        duration_seconds: 12,
        first_frame_path: "/tmp/a.png",
        last_frame_path: "/tmp/b.png",
      },
      message:
        "Gemini Omni Flash 1.2 accepts last_frame_path only up to 10 seconds.",
    },
    {
      name: "reference pictures with a first frame",
      input: {
        model: "minimax/h3",
        duration_seconds: 5,
        first_frame_path: "/tmp/a.png",
        reference_image_paths: ["/tmp/b.png"],
      },
      message:
        "MiniMax H3 takes reference_image_paths only without first_frame_path.",
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
