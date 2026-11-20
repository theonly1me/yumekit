import { readdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  connectFalMedia,
  placeholderKey,
  resultText,
  temporaryFolder,
  writeImage,
} from "./testing/connectFalMedia.ts";
import { fakeFal } from "./testing/fakeFal.ts";

async function callRejected(
  argumentsOf: (folder: string) => Promise<Record<string, unknown>>,
) {
  const folder = await temporaryFolder();
  const media = await connectFalMedia({
    environment: { FAL_KEY: placeholderKey },
    respond: fakeFal({}),
  });
  const result = await media.callTool({
    name: "generate_video",
    arguments: {
      prompt: "A lake",
      duration_seconds: 5,
      output_directory: join(folder, "assets"),
      file_stem: "lake",
      ...(await argumentsOf(folder)),
    },
  });
  return { result, requests: media.requests, folder };
}

const lengthMessage =
  "duration_seconds must be a whole number from 4 to 30 for Seedance 2.5.";

describe("generate_video rejects a setting before any request", () => {
  it.each([
    {
      name: "a length below 4 seconds",
      input: { duration_seconds: 3 },
      message: lengthMessage,
    },
    {
      name: "a length above 30 seconds",
      input: { duration_seconds: 31 },
      message: lengthMessage,
    },
    {
      name: "a length that is not whole",
      input: { duration_seconds: 4.5 },
      message: lengthMessage,
    },
    {
      name: "a resolution that the model does not have",
      input: { resolution: "2k" },
      message:
        "resolution must be one of 480p, 720p, 1080p, 4k for Seedance 2.5.",
    },
    {
      name: "an unknown model",
      input: { model: "fal-ai/unknown" },
      message:
        'model "fal-ai/unknown" is not a model of this server. Use one of: bytedance/seedance-2.5/us.',
    },
    {
      name: "reference images",
      input: { reference_image_paths: ["/tmp/a.png"] },
      message:
        "Seedance 2.5 does not accept reference_image_paths. Give first_frame_path and last_frame_path in their place.",
    },
    {
      name: "a last frame with no first frame",
      input: { last_frame_path: "/tmp/end.png" },
      message: "last_frame_path needs first_frame_path.",
    },
    {
      name: "a width with no height",
      input: { width_pixels: 1280 },
      message: "Give both width_pixels and height_pixels, or neither.",
    },
    {
      name: "a file_stem with a path",
      input: { file_stem: "../escape" },
      message: 'file_stem "../escape" must be a plain file name with no path',
    },
  ])("rejects $name", async (rejected) => {
    const { result, requests, folder } = await callRejected(() =>
      Promise.resolve(rejected.input),
    );

    expect(result.isError).toBe(true);
    expect(resultText(result)).toBe(rejected.message);
    expect(requests).toHaveLength(0);
    expect(await readdir(folder)).toEqual([]);
  });

  it("rejects a first frame that is not a PNG, JPEG, or WebP file", async () => {
    const { result, requests } = await callRejected(async (folder) => ({
      first_frame_path: await writeImage({ folder, name: "start.gif" }),
    }));

    expect(resultText(result)).toMatch(
      /^first_frame_path .*start\.gif is not a PNG, JPEG, or WebP file\.$/,
    );
    expect(requests).toHaveLength(0);
  });

  it("rejects a first frame larger than 30 MB", async () => {
    const { result, requests } = await callRejected(async (folder) => {
      const path = join(folder, "large.png");
      await writeFile(path, Buffer.alloc(30 * 1024 * 1024 + 1));
      return { first_frame_path: path };
    });

    expect(resultText(result)).toMatch(/is larger than 30 MB/);
    expect(requests).toHaveLength(0);
  });
});
