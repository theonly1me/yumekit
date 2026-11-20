import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";
import {
  bodyOf,
  connectFalMedia,
  placeholderKey,
  requestsTo,
  temporaryFolder,
  writeImage,
} from "./testing/connectFalMedia.ts";
import { fakeFal, fakeMp4, fakeUrls } from "./testing/fakeFal.ts";

const imageToVideoUrl =
  "https://queue.fal.run/bytedance/seedance-2.5/us/image-to-video";
const uploadInitiateUrl = "https://rest.fal.ai/storage/upload/initiate";

async function callImageToVideo(options: {
  arguments: (folder: string) => Promise<Record<string, unknown>>;
}) {
  const folder = await temporaryFolder();
  const media = await connectFalMedia({
    environment: { FAL_KEY: placeholderKey },
    respond: fakeFal({
      video: fakeMp4({
        widthPixels: 864,
        heightPixels: 480,
        durationSeconds: 4,
      }),
    }),
  });
  const result = await media.callTool({
    name: "generate_video",
    arguments: {
      prompt: "The fox turns its head",
      duration_seconds: 4,
      resolution: "480p",
      output_directory: folder,
      file_stem: "fox",
      ...(await options.arguments(folder)),
    },
  });
  return { result, media, folder };
}

describe("generate_video from a first frame", () => {
  it("uploads the first frame and sends its URL as image_url to the image endpoint", async () => {
    let firstFramePath = "";
    const { result, media } = await callImageToVideo({
      arguments: async (folder) => {
        firstFramePath = await writeImage({ folder, name: "fox.png" });
        return {
          first_frame_path: firstFramePath,
          width_pixels: 1080,
          height_pixels: 1920,
        };
      },
    });

    expect(result.isError).toBeFalsy();
    const [initiate] = requestsTo({
      requests: media.requests,
      prefix: uploadInitiateUrl,
    });
    expect(initiate?.url).toBe(
      "https://rest.fal.ai/storage/upload/initiate?storage_type=fal-cdn-v3",
    );
    expect(initiate?.headers.get("authorization")).toBe(
      `Key ${placeholderKey}`,
    );
    expect(initiate === undefined ? undefined : await bodyOf(initiate)).toEqual(
      {
        file_name: "fox.png",
        content_type: "image/png",
      },
    );
    const [upload] = requestsTo({
      requests: media.requests,
      prefix: fakeUrls.uploadUrlPrefix,
    });
    expect(upload?.method).toBe("PUT");
    expect(upload?.headers.get("authorization")).toBeNull();
    expect(upload?.headers.get("content-type")).toBe("image/png");
    expect(
      Buffer.from((await upload?.arrayBuffer()) ?? new ArrayBuffer(0)),
    ).toEqual(await readFile(firstFramePath));
    const [submit] = requestsTo({
      requests: media.requests,
      prefix: imageToVideoUrl,
    });
    expect(submit === undefined ? undefined : await bodyOf(submit)).toEqual({
      prompt: "The fox turns its head",
      image_url: `${fakeUrls.fileUrlPrefix}fox.png`,
      duration: "4",
      resolution: "480p",
      generate_audio: true,
      output_format: "mp4",
    });
  });

  it("uploads the last frame and sends it as end_image_url", async () => {
    const { media } = await callImageToVideo({
      arguments: async (folder) => ({
        first_frame_path: await writeImage({ folder, name: "start.png" }),
        last_frame_path: await writeImage({ folder, name: "end.jpg" }),
      }),
    });

    const initiates = requestsTo({
      requests: media.requests,
      prefix: uploadInitiateUrl,
    });
    expect(await Promise.all(initiates.map(bodyOf))).toEqual([
      { file_name: "start.png", content_type: "image/png" },
      { file_name: "end.jpg", content_type: "image/jpeg" },
    ]);
    const [submit] = requestsTo({
      requests: media.requests,
      prefix: imageToVideoUrl,
    });
    expect(
      submit === undefined ? undefined : await bodyOf(submit),
    ).toMatchObject({
      image_url: `${fakeUrls.fileUrlPrefix}start.png`,
      end_image_url: `${fakeUrls.fileUrlPrefix}end.jpg`,
    });
  });

  it("estimates the cost from the 480p price for one second and the real length", async () => {
    const { result } = await callImageToVideo({
      arguments: async (folder) => ({
        first_frame_path: await writeImage({ folder, name: "fox.webp" }),
      }),
    });

    expect(result.structuredContent).toMatchObject({
      files: [{ width_pixels: 864, height_pixels: 480, duration_seconds: 4 }],
      cost_usd: 0.882,
      cost_is_estimate: true,
    });
  });

  it("sends no request when the last frame cannot be read, so nothing is uploaded", async () => {
    const { result, media } = await callImageToVideo({
      arguments: async (folder) => ({
        first_frame_path: await writeImage({ folder, name: "start.png" }),
        last_frame_path: `${folder}/missing.png`,
      }),
    });

    expect(result.isError).toBe(true);
    expect(media.requests).toHaveLength(0);
  });
});
