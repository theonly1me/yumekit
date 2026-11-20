import { readdir } from "node:fs/promises";
import { describe, expect, it } from "vitest";
import { callVideo } from "./testing/callVideo.ts";
import { inOrder, resultText } from "./testing/connectGeminiMedia.ts";

async function rejectedBeforeAnyRequest(arguments_: Record<string, unknown>) {
  const { result, requests } = await callVideo({
    respond: inOrder([]),
    arguments: arguments_,
  });
  expect(result.isError).toBe(true);
  expect(requests).toHaveLength(0);
  return resultText(result);
}

describe("generate_video input checks", () => {
  it("tells the user to set GEMINI_API_KEY and list it in passEnvironment, and sends no request", async () => {
    const { result, requests, outputDirectory } = await callVideo({
      respond: inOrder([]),
      arguments: {},
      environment: {},
    });

    expect(result.isError).toBe(true);
    expect(resultText(result)).toContain("GEMINI_API_KEY is not set");
    expect(resultText(result)).toContain("passEnvironment");
    expect(requests).toHaveLength(0);
    await expect(readdir(outputDirectory)).rejects.toThrow();
  });

  it.each([2, 16, 4.5])(
    "rejects a duration_seconds of %s with the supported range",
    async (seconds) => {
      expect(
        await rejectedBeforeAnyRequest({ duration_seconds: seconds }),
      ).toBe(
        `duration_seconds must be a whole number from 3 to 15. It was ${String(seconds)}.`,
      );
    },
  );

  it("rejects last_frame_path for a clip longer than 10 seconds", async () => {
    expect(
      await rejectedBeforeAnyRequest({
        duration_seconds: 11,
        first_frame_path: "/images/first.png",
        last_frame_path: "/images/last.png",
      }),
    ).toBe(
      "last_frame_path works only with duration_seconds from 3 to 10, because the model supports a first and a last frame only up to 10 seconds.",
    );
  });

  it("rejects last_frame_path with no first_frame_path", async () => {
    expect(
      await rejectedBeforeAnyRequest({ last_frame_path: "/images/last.png" }),
    ).toBe("last_frame_path needs first_frame_path.");
  });

  it("rejects more than 6 reference images", async () => {
    const paths = [1, 2, 3, 4, 5, 6, 7].map(
      (imageNumber) => `/images/${String(imageNumber)}.png`,
    );
    expect(
      await rejectedBeforeAnyRequest({ reference_image_paths: paths }),
    ).toBe("reference_image_paths accepts up to 6 images. It had 7.");
  });

  it("rejects a resolution that the server does not offer, and names the supported values", async () => {
    expect(await rejectedBeforeAnyRequest({ resolution: "4k" })).toBe(
      "resolution must be 720p or 1080p. It was 4k.",
    );
  });

  it("rejects an unknown model with the list of ids", async () => {
    expect(await rejectedBeforeAnyRequest({ model: "veo-3.1" })).toBe(
      "model must be one of: gemini-omni-1.2-flash. It was veo-3.1.",
    );
  });

  it("rejects with_audio false, because the model always makes sound", async () => {
    expect(await rejectedBeforeAnyRequest({ with_audio: false })).toContain(
      "always makes sound, so with_audio cannot be false",
    );
  });

  it("rejects a width with no height", async () => {
    expect(await rejectedBeforeAnyRequest({ width_pixels: 1920 })).toBe(
      "Give both width_pixels and height_pixels, or neither.",
    );
  });

  it("rejects a file_stem with a path", async () => {
    expect(await rejectedBeforeAnyRequest({ file_stem: "../escape" })).toBe(
      'file_stem "../escape" must be a plain file name with no path',
    );
  });
});
