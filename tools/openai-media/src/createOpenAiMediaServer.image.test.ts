import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  connectOpenAiMedia,
  fakePng,
  imageResponse,
  placeholderKey,
  temporaryFolder,
} from "./testing/connectOpenAiMedia.ts";

describe("generate_image", () => {
  it("lists generate_image as its only tool", async () => {
    const media = await connectOpenAiMedia({
      environment: {},
      respond: () => imageResponse(fakePng({ width: 1, height: 1 })),
    });

    expect(await media.listToolNames()).toEqual(["generate_image"]);
  });

  it("writes the PNG from the API inside output_directory and returns the convention shape", async () => {
    const folder = await temporaryFolder();
    const png = fakePng({ width: 1536, height: 1024 });
    const media = await connectOpenAiMedia({
      environment: { OPENAI_API_KEY: placeholderKey },
      respond: () => imageResponse(png),
    });

    const result = await media.callTool({
      name: "generate_image",
      arguments: {
        prompt: "A red fox in snow",
        output_directory: folder,
        file_stem: "fox",
        width_pixels: 1536,
        height_pixels: 1024,
      },
    });

    const path = join(folder, "fox.png");
    expect(result.isError).toBeFalsy();
    expect(result.structuredContent).toEqual({
      files: [{ path, kind: "image", width_pixels: 1536, height_pixels: 1024 }],
    });
    expect(await readFile(path)).toEqual(png);
  });

  it("sends the prompt, the size, and the default model to the generations endpoint", async () => {
    const folder = await temporaryFolder();
    const media = await connectOpenAiMedia({
      environment: { OPENAI_API_KEY: placeholderKey },
      respond: () => imageResponse(fakePng({ width: 1024, height: 1024 })),
    });

    await media.callTool({
      name: "generate_image",
      arguments: {
        prompt: "A lake",
        output_directory: folder,
        file_stem: "lake",
      },
    });

    const [request] = media.requests;
    expect(request?.url).toBe("https://api.openai.com/v1/images/generations");
    expect(request?.headers.get("authorization")).toBe(
      `Bearer ${placeholderKey}`,
    );
    expect(await request?.json()).toEqual({
      model: "gpt-image-2.5-flare",
      prompt: "A lake",
      size: "auto",
      background: "auto",
      output_format: "png",
      n: 1,
    });
  });

  it("uses the model from YUMEKIT_OPENAI_IMAGE_MODEL", async () => {
    const folder = await temporaryFolder();
    const media = await connectOpenAiMedia({
      environment: {
        OPENAI_API_KEY: placeholderKey,
        YUMEKIT_OPENAI_IMAGE_MODEL: "gpt-image-2.6-sunburst",
      },
      respond: () => imageResponse(fakePng({ width: 16, height: 16 })),
    });

    await media.callTool({
      name: "generate_image",
      arguments: {
        prompt: "A lake",
        output_directory: folder,
        file_stem: "lake",
      },
    });

    expect(await media.requests[0]?.json()).toMatchObject({
      model: "gpt-image-2.6-sunburst",
    });
  });

  it("sends reference images to the edits endpoint with a transparent background", async () => {
    const folder = await temporaryFolder();
    const reference = join(folder, "logo.png");
    await writeFile(reference, fakePng({ width: 32, height: 32 }));
    const media = await connectOpenAiMedia({
      environment: { OPENAI_API_KEY: placeholderKey },
      respond: () => imageResponse(fakePng({ width: 32, height: 32 })),
    });

    const result = await media.callTool({
      name: "generate_image",
      arguments: {
        prompt: "The logo in blue",
        output_directory: folder,
        file_stem: "logo-blue",
        reference_image_paths: [reference],
        transparent_background: true,
      },
    });

    expect(result.isError).toBeFalsy();
    const [request] = media.requests;
    expect(request?.url).toBe("https://api.openai.com/v1/images/edits");
    const body = (await request?.text()) ?? "";
    expect(body).toContain('name="background"\r\n\r\ntransparent\r\n');
    expect(body).toContain('name="prompt"\r\n\r\nThe logo in blue\r\n');
    expect(body.match(/name="image\[\]"; filename="logo.png"/g)).toHaveLength(
      1,
    );
  });
});
