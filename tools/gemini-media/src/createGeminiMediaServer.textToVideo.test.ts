import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { callVideo, requestBody } from "./testing/callVideo.ts";
import {
  connectGeminiMedia,
  inOrder,
  placeholderKey,
} from "./testing/connectGeminiMedia.ts";
import {
  completedInteraction,
  fakeMp4,
  inProgressInteraction,
  sampleVideo,
} from "./testing/fakeInteractions.ts";

const finished = () =>
  completedInteraction({ id: "v1_lake", video: sampleVideo });

describe("generate_video from text", () => {
  it("lists generate_video, describe_media_server, and check_key", async () => {
    const media = await connectGeminiMedia({
      environment: {},
      respond: inOrder([]),
    });

    expect((await media.listToolNames()).toSorted()).toEqual([
      "check_key",
      "describe_media_server",
      "generate_video",
    ]);
  });

  it("creates a background interaction with the shape, resolution, and length, and sends the key in a header", async () => {
    const { requests } = await callVideo({
      respond: inOrder([finished]),
      arguments: {},
    });

    const [create] = requests;
    expect(create?.method).toBe("POST");
    expect(create?.url).toBe(
      "https://generativelanguage.googleapis.com/v1beta/interactions",
    );
    expect(create?.headers.get("x-goog-api-key")).toBe(placeholderKey);
    expect(create?.url).not.toContain(placeholderKey);
    expect(await requestBody(create)).toEqual({
      model: "gemini-omni-1.2-flash",
      input: "A lake at dawn",
      response_format: {
        type: "video",
        aspect_ratio: "16:9",
        resolution: "720p",
        duration: "5s",
      },
      background: true,
    });
  });

  it("writes the MP4 and reports its real size and length", async () => {
    const { result, outputDirectory } = await callVideo({
      respond: inOrder([finished]),
      arguments: {},
    });

    const path = join(outputDirectory, "lake.mp4");
    expect(result.isError).toBeUndefined();
    expect(result.structuredContent).toEqual({
      files: [
        {
          path,
          kind: "video",
          width_pixels: 1280,
          height_pixels: 720,
          duration_seconds: 5,
        },
      ],
    });
    expect(await readFile(path)).toEqual(sampleVideo);
  });

  it("polls the interaction every 10 seconds until it is completed, and reports progress", async () => {
    const { result, requests, waits, progress } = await callVideo({
      respond: inOrder([
        () => inProgressInteraction("v1_lake"),
        () => inProgressInteraction("v1_lake"),
        finished,
      ]),
      arguments: {},
    });

    expect(result.isError).toBeUndefined();
    expect(
      requests.map((request) => `${request.method} ${request.url}`),
    ).toEqual([
      "POST https://generativelanguage.googleapis.com/v1beta/interactions",
      "GET https://generativelanguage.googleapis.com/v1beta/interactions/v1_lake",
      "GET https://generativelanguage.googleapis.com/v1beta/interactions/v1_lake",
    ]);
    expect(waits).toEqual([10, 10]);
    expect(progress.map((update) => update.progress)).toEqual([1, 2]);
  });

  it("asks for 9:16 when the wanted height is larger than the width, and 16:9 when it is wider", async () => {
    const tall = await callVideo({
      respond: inOrder([finished]),
      arguments: { width_pixels: 1080, height_pixels: 1920 },
    });
    const square = await callVideo({
      respond: inOrder([finished]),
      arguments: { width_pixels: 1080, height_pixels: 1080 },
    });
    const wide = await callVideo({
      respond: inOrder([finished]),
      arguments: { width_pixels: 1920, height_pixels: 1080 },
    });

    expect(await requestBody(tall.requests[0])).toMatchObject({
      response_format: { aspect_ratio: "9:16" },
    });
    expect(await requestBody(square.requests[0])).toMatchObject({
      response_format: { aspect_ratio: "9:16" },
    });
    expect(await requestBody(wide.requests[0])).toMatchObject({
      response_format: { aspect_ratio: "16:9" },
    });
  });

  it("asks for 1080p only when resolution is 1080p", async () => {
    const { requests } = await callVideo({
      respond: inOrder([finished]),
      arguments: { resolution: "1080p", duration_seconds: 15 },
    });

    expect(await requestBody(requests[0])).toMatchObject({
      response_format: { resolution: "1080p", duration: "15s" },
    });
  });

  it("downloads the video with the key header when the result gives a Gemini URI", async () => {
    const uri =
      "https://generativelanguage.googleapis.com/v1beta/files/abc:download?alt=media";
    const tallVideo = fakeMp4({ width: 720, height: 1280, durationSeconds: 3 });
    const { result, requests } = await callVideo({
      respond: inOrder([
        () => completedInteraction({ id: "v1_lake", video: tallVideo, uri }),
        () => new Response(tallVideo),
      ]),
      arguments: { duration_seconds: 3 },
    });

    expect(requests[1]?.url).toBe(uri);
    expect(requests[1]?.headers.get("x-goog-api-key")).toBe(placeholderKey);
    expect(result.structuredContent).toMatchObject({
      files: [{ width_pixels: 720, height_pixels: 1280, duration_seconds: 3 }],
    });
  });

  it("uses the model from YUMEKIT_GEMINI_VIDEO_MODEL", async () => {
    const { requests } = await callVideo({
      respond: inOrder([finished]),
      arguments: {},
      environment: {
        GEMINI_API_KEY: placeholderKey,
        YUMEKIT_GEMINI_VIDEO_MODEL: "gemini-omni-1.3-flash",
      },
    });

    expect(await requestBody(requests[0])).toMatchObject({
      model: "gemini-omni-1.3-flash",
    });
  });
});
