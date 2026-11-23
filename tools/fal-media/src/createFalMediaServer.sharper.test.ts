import { writeFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { callFalTool } from "./testing/callFalTool.ts";
import {
  bodyOf,
  requestsTo,
  resultText,
  writeImage,
} from "./testing/connectFalMedia.ts";
import { fakeMp4, fakeUrls } from "./testing/fakeFal.ts";

async function writeVideo(folder: string): Promise<string> {
  const path = join(folder, "clip.mp4");
  await writeFile(
    path,
    fakeMp4({ widthPixels: 640, heightPixels: 360, durationSeconds: 5 }),
  );
  return path;
}

describe("sharpen_media", () => {
  it("uploads a video, sends it to the default video model, and estimates the cost from its length", async () => {
    const { result, media, folder, submits } = await callFalTool({
      name: "sharpen_media",
      arguments: async (folder) => ({
        media_path: await writeVideo(folder),
        scale: 2,
      }),
    });

    expect(result.isError, resultText(result)).toBeFalsy();
    expect(
      requestsTo({
        requests: media.requests,
        prefix: fakeUrls.uploadUrlPrefix,
      }).map((request) => request.headers.get("content-type")),
    ).toEqual(["video/mp4"]);
    const [submit] = submits;
    expect(submit?.url).toBe(
      "https://queue.fal.run/bria/video/increase-resolution",
    );
    expect(submit && (await bodyOf(submit))).toEqual({
      video_url: `${fakeUrls.fileUrlPrefix}clip.mp4`,
      desired_increase: "2",
      output_container_and_codec: "mp4_h264",
      preserve_audio: true,
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
      cost_usd: 0.7,
      cost_is_estimate: true,
    });
  });

  it("uses the first picture model for a picture when the call names no model", async () => {
    const { result, folder, submits } = await callFalTool({
      name: "sharpen_media",
      arguments: async (folder) => ({
        media_path: await writeImage({ folder, name: "face.png" }),
        scale: 4,
      }),
    });

    const [submit] = submits;
    expect(submit?.url).toBe("https://queue.fal.run/bria/increase-resolution");
    expect(submit && (await bodyOf(submit))).toEqual({
      image_url: `${fakeUrls.fileUrlPrefix}face.png`,
      desired_increase: 4,
      output_type: "png",
    });
    expect(result.structuredContent).toEqual({
      files: [
        {
          path: `${folder}/fox.png`,
          kind: "image",
          width_pixels: 1344,
          height_pixels: 768,
        },
      ],
      cost_usd: 0.04,
      cost_is_estimate: true,
    });
  });

  it("rejects a picture for a video model, before any request", async () => {
    const { result, media } = await callFalTool({
      name: "sharpen_media",
      arguments: async (folder) => ({
        media_path: await writeImage({ folder, name: "face.png" }),
        scale: 2,
        model: "openimaginglab/flashvsr-plus",
      }),
    });

    expect(result.isError).toBe(true);
    expect(resultText(result)).toBe(
      "FlashVSR+ for video sharpens only video. Pick a model for pictures.",
    );
    expect(media.requests).toHaveLength(0);
  });
});
