import { writeFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { callFalTool } from "./testing/callFalTool.ts";
import {
  bodyOf,
  requestsTo,
  resultText,
  writeImage,
  writeVoice,
} from "./testing/connectFalMedia.ts";
import { fakeFal, fakeMp4, fakeUrls } from "./testing/fakeFal.ts";

async function writeVideo(folder: string): Promise<string> {
  const path = join(folder, "person.mp4");
  await writeFile(
    path,
    fakeMp4({ widthPixels: 640, heightPixels: 360, durationSeconds: 3 }),
  );
  return path;
}

describe("generate_talking_clip", () => {
  it("uploads the picture and the voice, sends them to the default picture model, and estimates the cost from the clip length", async () => {
    const { result, media, folder, submits } = await callFalTool({
      name: "generate_talking_clip",
      arguments: async (folder) => ({
        media_path: await writeImage({ folder, name: "face.png" }),
        audio_path: await writeVoice({ folder, seconds: 5 }),
        prompt: "Smiles and nods",
      }),
    });

    expect(result.isError, resultText(result)).toBeFalsy();
    expect(
      requestsTo({
        requests: media.requests,
        prefix: fakeUrls.uploadUrlPrefix,
      }).map((request) => request.headers.get("content-type")),
    ).toEqual(["image/png", "audio/wav"]);
    const [submit] = submits;
    expect(submit?.url).toBe(
      "https://queue.fal.run/heygen/avatar-6/turbo/image-to-video",
    );
    expect(submit && (await bodyOf(submit))).toEqual({
      image_url: `${fakeUrls.fileUrlPrefix}face.png`,
      audio_url: `${fakeUrls.fileUrlPrefix}voice.wav`,
      resolution: "1080p",
      motion_prompt: "Smiles and nods",
    });
    expect(result.structuredContent).toEqual({
      files: [
        {
          path: `${folder}/fox.mp4`,
          kind: "video",
          duration_seconds: 5,
          width_pixels: 1280,
          height_pixels: 720,
        },
      ],
      cost_usd: 0.25,
      cost_is_estimate: true,
    });
  });

  it("uses the first video model for a video of the person when the call names no model", async () => {
    const { result, submits } = await callFalTool({
      name: "generate_talking_clip",
      arguments: async (folder) => ({
        media_path: await writeVideo(folder),
        audio_path: await writeVoice({ folder, seconds: 5 }),
      }),
    });

    const [submit] = submits;
    expect(submit?.url).toBe("https://queue.fal.run/fal-ai/pixverse/lipsync");
    expect(submit && (await bodyOf(submit))).toEqual({
      video_url: `${fakeUrls.fileUrlPrefix}person.mp4`,
      audio_url: `${fakeUrls.fileUrlPrefix}voice.wav`,
    });
    expect(result.structuredContent).toMatchObject({ cost_usd: 0.2 });
  });

  it("adds the long voice factor of MiniMax H3 Max Lip Sync to the estimate after 15 seconds", async () => {
    const { result } = await callFalTool({
      name: "generate_talking_clip",
      arguments: async (folder) => ({
        media_path: await writeImage({ folder, name: "face.png" }),
        audio_path: await writeVoice({ folder, seconds: 20 }),
        model: "minimax/h3-max/lip-sync/image-to-video",
      }),
      respond: fakeFal({
        video: fakeMp4({
          widthPixels: 1366,
          heightPixels: 768,
          durationSeconds: 20,
        }),
      }),
    });

    expect(result.structuredContent).toMatchObject({ cost_usd: 1.92 });
  });

  it("rejects a voice shorter than the minimum of the model, before any request", async () => {
    const { result, media } = await callFalTool({
      name: "generate_talking_clip",
      arguments: async (folder) => ({
        media_path: await writeImage({ folder, name: "face.png" }),
        audio_path: await writeVoice({ folder, seconds: 2 }),
        model: "minimax/h3-max/lip-sync/image-to-video",
      }),
    });

    expect(result.isError).toBe(true);
    expect(resultText(result)).toBe(
      "MiniMax H3 Max Lip Sync needs a voice of at least 5 seconds. This voice is 2.0 seconds.",
    );
    expect(media.requests).toHaveLength(0);
  });

  it("rejects a picture for a video model, before any request", async () => {
    const { result, media } = await callFalTool({
      name: "generate_talking_clip",
      arguments: async (folder) => ({
        media_path: await writeImage({ folder, name: "face.png" }),
        audio_path: await writeVoice({ folder, seconds: 5 }),
        model: "veed/lipsync/v2",
      }),
    });

    expect(result.isError).toBe(true);
    expect(resultText(result)).toBe(
      "VEED Lipsync 2 takes only a video of the person. Pick a model for a picture.",
    );
    expect(media.requests).toHaveLength(0);
  });
});
