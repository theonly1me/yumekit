import { readdir } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  connectOpenAiMedia,
  fakePng,
  imageResponse,
  placeholderKey,
  resultText,
  temporaryFolder,
} from "./testing/connectOpenAiMedia.ts";

async function callImage(options: {
  environment: NodeJS.ProcessEnv;
  respond: (request: Request) => Promise<Response>;
  arguments: Record<string, unknown>;
}) {
  const folder = await temporaryFolder();
  const outputDirectory = join(folder, "assets");
  const media = await connectOpenAiMedia(options);
  const result = await media.callTool({
    name: "generate_image",
    arguments: {
      prompt: "A lake",
      output_directory: outputDirectory,
      file_stem: "lake",
      ...options.arguments,
    },
  });
  return { result, folder, requests: media.requests };
}

const anyImage = () => imageResponse(fakePng({ width: 16, height: 16 }));

describe("generate_image failures", () => {
  it("tells the user to set OPENAI_API_KEY and sends no request when the key is missing", async () => {
    const { result, requests } = await callImage({
      environment: {},
      respond: anyImage,
      arguments: {},
    });

    expect(result.isError).toBe(true);
    expect(resultText(result)).toContain("OPENAI_API_KEY is not set");
    expect(requests).toHaveLength(0);
  });

  it("returns the status and the message of an API error and writes no file", async () => {
    const { result, folder } = await callImage({
      environment: { OPENAI_API_KEY: placeholderKey },
      respond: () =>
        Promise.resolve(
          Response.json(
            { error: { message: "Incorrect API key provided" } },
            { status: 401 },
          ),
        ),
      arguments: {},
    });

    expect(result.isError).toBe(true);
    expect(resultText(result)).toBe(
      "The OpenAI API answered 401: Incorrect API key provided",
    );
    expect(await readdir(folder)).toEqual([]);
  });

  it("returns a message when the network call fails", async () => {
    const { result } = await callImage({
      environment: { OPENAI_API_KEY: placeholderKey },
      respond: () => Promise.reject(new Error("getaddrinfo ENOTFOUND")),
      arguments: {},
    });

    expect(result.isError).toBe(true);
    expect(resultText(result)).toBe(
      "Cannot reach the OpenAI API: getaddrinfo ENOTFOUND",
    );
  });

  it("rejects a file_stem with a path before any request, so no file lands outside output_directory", async () => {
    const { result, folder, requests } = await callImage({
      environment: { OPENAI_API_KEY: placeholderKey },
      respond: anyImage,
      arguments: { file_stem: "../escape" },
    });

    expect(result.isError).toBe(true);
    expect(requests).toHaveLength(0);
    expect(await readdir(folder)).toEqual([]);
  });

  it("rejects a width with no height", async () => {
    const { result, requests } = await callImage({
      environment: { OPENAI_API_KEY: placeholderKey },
      respond: anyImage,
      arguments: { width_pixels: 1024 },
    });

    expect(resultText(result)).toBe(
      "Give both width_pixels and height_pixels, or neither.",
    );
    expect(requests).toHaveLength(0);
  });

  it("rejects a size that is not a multiple of 16 and names the nearest valid size", async () => {
    const { result } = await callImage({
      environment: { OPENAI_API_KEY: placeholderKey },
      respond: anyImage,
      arguments: { width_pixels: 1010, height_pixels: 1030 },
    });

    expect(resultText(result)).toBe(
      "width_pixels and height_pixels must be multiples of 16. The nearest valid size is width_pixels 1008 and height_pixels 1024.",
    );
  });

  it("rejects an aspect ratio wider than 3 to 1", async () => {
    const { result } = await callImage({
      environment: { OPENAI_API_KEY: placeholderKey },
      respond: anyImage,
      arguments: { width_pixels: 3200, height_pixels: 1024 },
    });

    expect(resultText(result)).toBe(
      "The long side can be at most 3 times the short side.",
    );
  });
});
