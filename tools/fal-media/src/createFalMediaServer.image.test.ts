import { readdir } from "node:fs/promises";
import { describe, expect, it } from "vitest";
import { callFalTool } from "./testing/callFalTool.ts";
import {
  bodyOf,
  connectFalMedia,
  requestsTo,
  resultText,
  writeImage,
} from "./testing/connectFalMedia.ts";
import { fakeFal, fakeUrls } from "./testing/fakeFal.ts";

const seedreamQueue = "https://queue.fal.run/bytedance/seedream/v5.5";

describe("generate_image", () => {
  it("makes a PNG with the default model at the nearest size of the same shape", async () => {
    const { result, folder, submits } = await callFalTool({
      name: "generate_image",
      arguments: () =>
        Promise.resolve({ width_pixels: 1920, height_pixels: 1080 }),
    });

    expect(result.isError).toBeFalsy();
    const [submit] = submits;
    expect(submit?.url).toBe(`${seedreamQueue}/text-to-image`);
    expect(submit && (await bodyOf(submit))).toEqual({
      prompt: "A red fox in snow",
      image_size: { width: 2112, height: 1184 },
      num_images: 1,
      output_format: "png",
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
      cost_usd: 0.03,
      cost_is_estimate: true,
    });
  });

  it("uploads each reference picture and sends the edit endpoint the uploaded URLs", async () => {
    const { result, media, submits } = await callFalTool({
      name: "generate_image",
      arguments: async (folder) => ({
        reference_image_paths: [
          await writeImage({ folder, name: "face.png" }),
          await writeImage({ folder, name: "cup.png" }),
        ],
        transparent_background: true,
      }),
    });

    expect(
      requestsTo({
        requests: media.requests,
        prefix: fakeUrls.uploadUrlPrefix,
      }),
    ).toHaveLength(2);
    const [submit] = submits;
    expect(submit?.url).toBe(`${seedreamQueue}/edit`);
    expect(submit && (await bodyOf(submit))).toMatchObject({
      image_urls: [
        `${fakeUrls.fileUrlPrefix}face.png`,
        `${fakeUrls.fileUrlPrefix}cup.png`,
      ],
      background: "transparent",
    });
    expect(result.structuredContent).toMatchObject({ cost_usd: 0.054 });
  });

  it("gives no cost when the page of the model gives no price", async () => {
    const { result } = await callFalTool({
      name: "generate_image",
      arguments: () => Promise.resolve({ model: "minimax/h3-image" }),
    });

    expect(result.isError).toBeFalsy();
    expect(result.structuredContent).not.toHaveProperty("cost_usd");
  });

  it.each([
    {
      name: "reference pictures for a model with none",
      input: { model: "ideogram/v4.6", reference_image_paths: ["/tmp/a.png"] },
      message: "Ideogram 4.6 does not accept reference_image_paths.",
    },
    {
      name: "more reference pictures than the model takes",
      input: {
        model: "alibaba/qwen-image-3",
        reference_image_paths: ["/a.png", "/b.png", "/c.png", "/d.png"],
      },
      message: "Qwen Image 3 accepts at most 3 reference_image_paths.",
    },
    {
      name: "a transparent background for a model that cannot make one",
      input: { model: "google/nano-banana-2.1", transparent_background: true },
      message: "Nano Banana 2.1 cannot make a transparent background.",
    },
    {
      name: "a quality that the model does not have",
      input: { model: "ideogram/v4.6", quality: "best" },
      message:
        "quality must be one of very_low, low, medium, high for Ideogram 4.6.",
    },
    {
      name: "a setting that the model does not have",
      input: { model: "alibaba/qwen-image-3", resolution: "2K" },
      message: "Qwen Image 3 has no resolution setting.",
    },
    {
      name: "a video model",
      input: { model: "kling/v4" },
      message: /^model "kling\/v4" is not a picture model of this server/,
    },
  ])("rejects $name before any request", async (rejected) => {
    const { result, media, folder } = await callFalTool({
      name: "generate_image",
      arguments: () => Promise.resolve(rejected.input),
    });

    expect(result.isError).toBe(true);
    expect(resultText(result)).toMatch(rejected.message);
    expect(media.requests).toHaveLength(0);
    expect(await readdir(folder)).toEqual([]);
  });

  it("fails with the fal URL when the picture is not a PNG, JPEG, or WebP file", async () => {
    const { result } = await callFalTool({
      name: "generate_image",
      arguments: () => Promise.resolve({}),
      respond: fakeFal({
        answer: (request) =>
          request.url === fakeUrls.imageUrl
            ? Promise.resolve(new Response("not a picture"))
            : undefined,
      }),
    });

    expect(result.isError).toBe(true);
    expect(resultText(result)).toBe(
      `fal sent a picture that is not a PNG, JPEG, or WebP file: ${fakeUrls.imageUrl}`,
    );
  });

  it("names FAL_KEY when the key is missing, and sends no request", async () => {
    const media = await connectFalMedia({
      environment: {},
      respond: fakeFal({}),
    });
    const result = await media.callTool({
      name: "generate_image",
      arguments: {
        prompt: "A fox",
        output_directory: "/tmp",
        file_stem: "fox",
      },
    });

    expect(resultText(result)).toMatch(/^FAL_KEY is not set/);
    expect(media.requests).toHaveLength(0);
  });
});
