import { writeFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { callVideo, requestBody } from "./testing/callVideo.ts";
import {
  inOrder,
  resultText,
  temporaryFolder,
} from "./testing/connectGeminiMedia.ts";
import {
  completedInteraction,
  sampleVideo,
} from "./testing/fakeInteractions.ts";

const finished = () =>
  completedInteraction({ id: "v1_frames", video: sampleVideo });

async function imageFile(options: {
  name: string;
  bytes: string;
}): Promise<string> {
  const path = join(await temporaryFolder(), options.name);
  await writeFile(path, options.bytes);
  return path;
}

const base64 = (text: string) => Buffer.from(text).toString("base64");

describe("generate_video with images", () => {
  it("sends the first frame as an image before the prompt, with the image to video task", async () => {
    const firstFrame = await imageFile({ name: "first.png", bytes: "first" });
    const { result, requests } = await callVideo({
      respond: inOrder([finished]),
      arguments: { first_frame_path: firstFrame },
    });

    expect(result.isError).toBeUndefined();
    expect(await requestBody(requests[0])).toMatchObject({
      input: [
        { type: "image", data: base64("first"), mime_type: "image/png" },
        { type: "text", text: "A lake at dawn" },
      ],
      generation_config: { video_config: { task: "image_to_video" } },
    });
  });

  it("sends the first frame and then the last frame", async () => {
    const firstFrame = await imageFile({ name: "first.png", bytes: "first" });
    const lastFrame = await imageFile({ name: "last.jpg", bytes: "last" });
    const { requests } = await callVideo({
      respond: inOrder([finished]),
      arguments: {
        first_frame_path: firstFrame,
        last_frame_path: lastFrame,
        duration_seconds: 10,
      },
    });

    expect(await requestBody(requests[0])).toMatchObject({
      input: [
        { type: "image", data: base64("first"), mime_type: "image/png" },
        { type: "image", data: base64("last"), mime_type: "image/jpeg" },
        { type: "text", text: "A lake at dawn" },
      ],
      generation_config: { video_config: { task: "image_to_video" } },
    });
  });

  it("sends reference images with no task, so the model reads their roles from the prompt", async () => {
    const cat = await imageFile({ name: "cat.webp", bytes: "cat" });
    const { requests } = await callVideo({
      respond: inOrder([finished]),
      arguments: { reference_image_paths: [cat] },
    });

    const body = await requestBody(requests[0]);
    expect(body).toMatchObject({
      input: [
        { type: "image", data: base64("cat"), mime_type: "image/webp" },
        { type: "text", text: "A lake at dawn" },
      ],
    });
    expect(body).not.toHaveProperty("generation_config");
  });

  it("rejects an image that is not a PNG, JPEG, or WebP file before any request", async () => {
    const drawing = await imageFile({ name: "drawing.gif", bytes: "gif" });
    const { result, requests } = await callVideo({
      respond: inOrder([finished]),
      arguments: { first_frame_path: drawing },
    });

    expect(result.isError).toBe(true);
    expect(resultText(result)).toBe(
      `${drawing} is not a PNG, JPEG, or WebP file.`,
    );
    expect(requests).toHaveLength(0);
  });

  it("returns a message for an image file that does not exist, before any request", async () => {
    const missing = join(await temporaryFolder(), "missing.png");
    const { result, requests } = await callVideo({
      respond: inOrder([finished]),
      arguments: { first_frame_path: missing },
    });

    expect(result.isError).toBe(true);
    expect(resultText(result)).toContain(`Cannot read ${missing}`);
    expect(requests).toHaveLength(0);
  });
});
