import { describe, expect, it } from "vitest";
import { base64Of, callTool, pictureFiles } from "../testing/callTool.ts";
import { resultText } from "../testing/connectGeminiMedia.ts";
import { completedOutput, fakePng } from "../testing/fakeOutputs.ts";

const madePicture = completedOutput({
  id: "v1_picture",
  type: "image",
  mimeType: "image/png",
  bytes: fakePng({ width: 768, height: 1376 }),
});

function callImage(options: { arguments: Record<string, unknown> }) {
  return callTool({
    name: "generate_image",
    arguments: { prompt: "A lake", ...options.arguments },
    respond: madePicture,
  });
}

const tallWithDefaults = { width_pixels: 1080, height_pixels: 1920 };

describe("generate_image", () => {
  it("sends the documented body of each picture model with the default settings", async () => {
    const sized = [
      "gemini-nano-banana-2.1",
      "gemini-3.1-flash-image",
      "gemini-3-pro-image",
    ];
    for (const model of sized) {
      const { bodies } = await callImage({
        arguments: { ...tallWithDefaults, model, resolution: "1K" },
      });
      expect(bodies, model).toEqual([
        {
          model,
          input: [{ type: "text", text: "A lake" }],
          response_format: {
            type: "image",
            aspect_ratio: "9:16",
            image_size: "1K",
          },
        },
      ]);
    }
    const lite = await callImage({
      arguments: { ...tallWithDefaults, model: "gemini-3.1-flash-lite-image" },
    });
    expect(lite.bodies).toEqual([
      {
        model: "gemini-3.1-flash-lite-image",
        input: [{ type: "text", text: "A lake" }],
        response_format: { type: "image", aspect_ratio: "9:16" },
      },
    ]);
  });

  it("uses Nano Banana 2.1 with no model, and sends no shape with no size", async () => {
    const { bodies, requests } = await callImage({ arguments: {} });

    expect(requests[0]?.url).toBe(
      "https://generativelanguage.googleapis.com/v1beta/interactions",
    );
    expect(bodies).toEqual([
      {
        model: "gemini-nano-banana-2.1",
        input: [{ type: "text", text: "A lake" }],
        response_format: { type: "image", image_size: "1K" },
      },
    ]);
  });

  it("picks the nearest shape that the model has", async () => {
    const veryTall = { width_pixels: 384, height_pixels: 3072 };
    const nano = await callImage({ arguments: veryTall });
    const pro = await callImage({
      arguments: { ...veryTall, model: "gemini-3-pro-image" },
    });

    expect(nano.bodies).toMatchObject([
      { response_format: { aspect_ratio: "1:8" } },
    ]);
    expect(pro.bodies).toMatchObject([
      { response_format: { aspect_ratio: "9:16" } },
    ]);
  });

  it("sends the prompt first and then each reference picture", async () => {
    const paths = await pictureFiles(2);
    const { bodies } = await callImage({
      arguments: { reference_image_paths: paths },
    });

    expect(bodies).toMatchObject([
      {
        input: [
          { type: "text", text: "A lake" },
          {
            type: "image",
            mime_type: "image/png",
            data: base64Of("picture 0"),
          },
          {
            type: "image",
            mime_type: "image/png",
            data: base64Of("picture 1"),
          },
        ],
      },
    ]);
  });

  it("writes the picture and reports its size", async () => {
    const { result } = await callImage({ arguments: {} });

    expect(result.structuredContent).toMatchObject({
      files: [{ kind: "image", width_pixels: 768, height_pixels: 1376 }],
    });
    expect(resultText(result)).toMatch(/made\.png/);
  });

  it("rejects what a model cannot do before any request", async () => {
    const [reference] = await pictureFiles(1);
    const cases = [
      { transparent_background: true },
      {
        model: "gemini-3.1-flash-lite-image",
        reference_image_paths: [reference],
      },
      { model: "gemini-3.1-flash-lite-image", resolution: "2K" },
      { resolution: "8K" },
      { model: "imagen-4.0-generate" },
      { width_pixels: 100 },
    ];
    for (const input of cases) {
      const { result, requests } = await callImage({ arguments: input });
      expect(result.isError, JSON.stringify(input)).toBe(true);
      expect(requests, JSON.stringify(input)).toHaveLength(0);
    }
  });
});
