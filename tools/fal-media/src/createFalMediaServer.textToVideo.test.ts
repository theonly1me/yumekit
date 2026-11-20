import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  bodyOf,
  connectFalMedia,
  placeholderKey,
  requestsTo,
  temporaryFolder,
} from "./testing/connectFalMedia.ts";
import { fakeFal, fakeMp4, fakeUrls } from "./testing/fakeFal.ts";

const textToVideoUrl =
  "https://queue.fal.run/bytedance/seedance-2.5/us/text-to-video";

async function callTextToVideo(options: {
  arguments: Record<string, unknown>;
  statuses?: string[];
  video?: Buffer;
}) {
  const folder = await temporaryFolder();
  const outputDirectory = join(folder, "assets");
  const media = await connectFalMedia({
    environment: { FAL_KEY: placeholderKey },
    respond: fakeFal({
      ...(options.statuses === undefined ? {} : { statuses: options.statuses }),
      ...(options.video === undefined ? {} : { video: options.video }),
    }),
  });
  const result = await media.callTool({
    name: "generate_video",
    arguments: {
      prompt: "A paper boat on a lake",
      duration_seconds: 6,
      output_directory: outputDirectory,
      file_stem: "boat",
      ...options.arguments,
    },
  });
  return { result, outputDirectory, media };
}

describe("generate_video from text", () => {
  it("submits the Seedance text to video fields with the Key header", async () => {
    const { media } = await callTextToVideo({
      arguments: { width_pixels: 1080, height_pixels: 1920, with_audio: false },
    });

    const [submit] = requestsTo({
      requests: media.requests,
      prefix: textToVideoUrl,
    });
    expect(submit?.method).toBe("POST");
    expect(submit?.headers.get("authorization")).toBe(`Key ${placeholderKey}`);
    expect(submit === undefined ? undefined : await bodyOf(submit)).toEqual({
      prompt: "A paper boat on a lake",
      duration: "6",
      resolution: "720p",
      aspect_ratio: "9:16",
      generate_audio: false,
      output_format: "mp4",
    });
  });

  it.each([
    { width: 1920, height: 1080, shape: "16:9" },
    { width: 2560, height: 1080, shape: "21:9" },
    { width: 1440, height: 1080, shape: "4:3" },
    { width: 1000, height: 1000, shape: "1:1" },
    { width: 1080, height: 1440, shape: "3:4" },
  ])("asks for $shape for $width by $height", async (size) => {
    const { media } = await callTextToVideo({
      arguments: { width_pixels: size.width, height_pixels: size.height },
    });

    const [submit] = requestsTo({
      requests: media.requests,
      prefix: textToVideoUrl,
    });
    expect(
      submit === undefined ? undefined : await bodyOf(submit),
    ).toMatchObject({
      aspect_ratio: size.shape,
    });
  });

  it("asks for 16:9 with sound when the request gives no size", async () => {
    const { media } = await callTextToVideo({ arguments: {} });

    const [submit] = requestsTo({
      requests: media.requests,
      prefix: textToVideoUrl,
    });
    expect(
      submit === undefined ? undefined : await bodyOf(submit),
    ).toMatchObject({
      aspect_ratio: "16:9",
      generate_audio: true,
    });
  });

  it("writes the downloaded MP4 and reports its real size, length, and estimated cost", async () => {
    const video = fakeMp4({
      widthPixels: 1248,
      heightPixels: 704,
      durationSeconds: 6,
    });
    const { result, outputDirectory } = await callTextToVideo({
      arguments: { resolution: "1080p" },
      video,
    });

    const path = join(outputDirectory, "boat.mp4");
    expect(result.isError).toBeFalsy();
    expect(result.structuredContent).toEqual({
      files: [
        {
          path,
          kind: "video",
          width_pixels: 1248,
          height_pixels: 704,
          duration_seconds: 6,
        },
      ],
      cost_usd: 6.984,
      cost_is_estimate: true,
    });
    expect(await readFile(path)).toEqual(video);
  });

  it("polls again while the result is not ready, and downloads the video without the key", async () => {
    const { result, media } = await callTextToVideo({
      arguments: {},
      statuses: ["IN_QUEUE", "IN_PROGRESS", "COMPLETED"],
    });

    expect(result.isError).toBeFalsy();
    expect(
      requestsTo({ requests: media.requests, prefix: fakeUrls.statusUrl }),
    ).toHaveLength(3);
    expect(media.waits).toEqual([5, 5]);
    const [download] = requestsTo({
      requests: media.requests,
      prefix: fakeUrls.videoUrl,
    });
    expect(download?.headers.get("authorization")).toBeNull();
  });

  it("sends a progress notification for each poll that is not complete", async () => {
    const folder = await temporaryFolder();
    const media = await connectFalMedia({
      environment: { FAL_KEY: placeholderKey },
      respond: fakeFal({ statuses: ["IN_QUEUE", "IN_PROGRESS", "COMPLETED"] }),
    });
    const messages: (string | undefined)[] = [];
    await media.callTool({
      name: "generate_video",
      arguments: {
        prompt: "A paper boat",
        duration_seconds: 4,
        output_directory: folder,
        file_stem: "boat",
      },
      onProgress: (progress) => messages.push(progress.message),
    });

    expect(messages).toEqual([
      "fal status: IN_QUEUE",
      "fal status: IN_PROGRESS",
    ]);
  });
});
