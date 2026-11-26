import { truncate } from "node:fs/promises";
import { describe, expect, it } from "vitest";
import { callVideo } from "./testing/callVideo.ts";
import {
  bodyOf,
  resultText,
  writePicture,
} from "./testing/connectSandMedia.ts";
import { fakeSand } from "./testing/fakeSand.ts";

function dataUrl(options: { mimeType: string; text: string }): string {
  return `data:${options.mimeType};base64,${Buffer.from(options.text).toString("base64")}`;
}

describe("generate_video with pictures", () => {
  it("sends the start picture with the role first_frame, so the clip starts on that picture", async () => {
    const { creates } = await callVideo({
      respond: fakeSand({}),
      arguments: async (folder) => ({
        first_frame_path: await writePicture({
          folder,
          name: "start.png",
          text: "start picture",
        }),
      }),
    });

    expect(await bodyOf(creates[0])).toMatchObject({
      content: [
        { type: "text", text: "Waves break against the rocks at dawn" },
        {
          type: "image_url",
          role: "first_frame",
          image_url: {
            url: dataUrl({ mimeType: "image/png", text: "start picture" }),
          },
        },
      ],
    });
  });

  it("sends a first and a last picture with their roles", async () => {
    const { creates } = await callVideo({
      respond: fakeSand({}),
      arguments: async (folder) => ({
        first_frame_path: await writePicture({
          folder,
          name: "start.jpg",
          text: "start",
        }),
        last_frame_path: await writePicture({
          folder,
          name: "end.webp",
          text: "end",
        }),
      }),
    });

    const body = await bodyOf(creates[0]);
    expect(body).toMatchObject({
      content: [
        { type: "text" },
        {
          role: "first_frame",
          image_url: {
            url: dataUrl({ mimeType: "image/jpeg", text: "start" }),
          },
        },
        {
          role: "last_frame",
          image_url: { url: dataUrl({ mimeType: "image/webp", text: "end" }) },
        },
      ],
    });
  });

  it("sends reference pictures with the role reference_image", async () => {
    const { creates } = await callVideo({
      respond: fakeSand({}),
      arguments: async (folder) => ({
        reference_image_paths: [
          await writePicture({ folder, name: "face.png", text: "face" }),
          await writePicture({ folder, name: "mug.png", text: "mug" }),
        ],
      }),
    });

    expect(await bodyOf(creates[0])).toMatchObject({
      content: [
        { type: "text" },
        {
          role: "reference_image",
          image_url: { url: dataUrl({ mimeType: "image/png", text: "face" }) },
        },
        {
          role: "reference_image",
          image_url: { url: dataUrl({ mimeType: "image/png", text: "mug" }) },
        },
      ],
    });
  });

  it("rejects a picture of 30,000,000 bytes before any request, because Sand AI takes a smaller one", async () => {
    const { result, requests } = await callVideo({
      respond: fakeSand({}),
      arguments: async (folder) => {
        const path = await writePicture({ folder, name: "big.png", text: "" });
        await truncate(path, 30_000_000);
        return { first_frame_path: path };
      },
    });

    expect(result.isError).toBe(true);
    expect(resultText(result)).toMatch(
      /big\.png has 30000000 bytes\. Sand AI takes a picture under 30,000,000 bytes\.$/,
    );
    expect(requests).toHaveLength(0);
  });

  it("rejects a picture that is not a PNG, JPEG, or WebP file before any request", async () => {
    const { result, requests } = await callVideo({
      respond: fakeSand({}),
      arguments: async (folder) => ({
        first_frame_path: await writePicture({
          folder,
          name: "start.gif",
          text: "gif",
        }),
      }),
    });

    expect(resultText(result)).toMatch(
      /start\.gif is not a PNG, JPEG, or WebP file\.$/,
    );
    expect(requests).toHaveLength(0);
  });
});
