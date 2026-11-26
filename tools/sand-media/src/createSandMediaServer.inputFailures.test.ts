import { readdir } from "node:fs/promises";
import { describe, expect, it } from "vitest";
import { callVideo } from "./testing/callVideo.ts";
import { resultText } from "./testing/connectSandMedia.ts";
import { fakeSand } from "./testing/fakeSand.ts";

describe("generate_video rejects an input before any request", () => {
  it("names SAND_API_KEY and the page of the keys when the key is missing", async () => {
    const { result, requests } = await callVideo({
      respond: fakeSand({}),
      environment: {},
    });

    expect(result.isError).toBe(true);
    expect(resultText(result)).toBe(
      "SAND_API_KEY is not set. Create a key at https://platform.sand.ai/app/keys/, then add it in the editor under Tools or run yumekit keys set SAND_API_KEY.",
    );
    expect(requests).toHaveLength(0);
  });

  const lengthMessage = (seconds: number) =>
    `duration_seconds must be a whole number from 4 to 30 for MAGI-2. It was ${String(seconds)}.`;

  it.each([
    {
      name: "a length below 4 seconds",
      input: { duration_seconds: 3 },
      message: lengthMessage(3),
    },
    {
      name: "a length above 30 seconds",
      input: { duration_seconds: 31 },
      message: lengthMessage(31),
    },
    {
      name: "a length that is not whole",
      input: { duration_seconds: 4.5 },
      message: lengthMessage(4.5),
    },
    {
      name: "a resolution other than 1080p",
      input: { resolution: "720p" },
      message:
        "resolution must be 1080p, the only size of MAGI-2. It was 720p.",
    },
    {
      name: "another model",
      input: { model: "magi-1" },
      message: "model must be magi-2. It was magi-1.",
    },
    {
      name: "a prompt longer than 15,000 characters",
      input: { prompt: "a".repeat(15_001) },
      message: "prompt has 15001 characters. Sand AI takes at most 15,000.",
    },
    {
      name: "a last frame with no first frame",
      input: { last_frame_path: "/tmp/end.png" },
      message: "last_frame_path needs first_frame_path.",
    },
    {
      name: "reference pictures with a first frame",
      input: {
        first_frame_path: "/tmp/a.png",
        reference_image_paths: ["/tmp/b.png"],
      },
      message:
        "reference_image_paths cannot go with first_frame_path or last_frame_path. Sand AI takes reference pictures or frames in one clip, not both.",
    },
    {
      name: "more than 10 reference pictures",
      input: {
        reference_image_paths: Array.from({ length: 11 }, () => "/tmp/a.png"),
      },
      message: "reference_image_paths takes at most 10 pictures. It had 11.",
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
    const { result, requests, folder } = await callVideo({
      respond: fakeSand({}),
      arguments: () => Promise.resolve(rejected.input),
    });

    expect(result.isError).toBe(true);
    expect(resultText(result)).toBe(rejected.message);
    expect(requests).toHaveLength(0);
    expect(await readdir(folder)).toEqual([]);
  });
});
