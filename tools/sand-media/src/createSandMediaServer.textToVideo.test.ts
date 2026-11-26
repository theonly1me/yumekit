import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { callVideo } from "./testing/callVideo.ts";
import { bodyOf, placeholderKey } from "./testing/connectSandMedia.ts";
import { fakeMp4, fakeSand, fakeTask, taskAnswer } from "./testing/fakeSand.ts";

describe("generate_video makes a MAGI-2 clip from a prompt", () => {
  it("sends the prompt to the Ark task endpoint of Sand AI with the key as a Bearer token", async () => {
    const { result, creates } = await callVideo({ respond: fakeSand({}) });

    expect(result.isError).toBeFalsy();
    const [create] = creates;
    expect(create?.url).toBe(fakeTask.tasksUrl);
    expect(create?.headers.get("authorization")).toBe(
      `Bearer ${placeholderKey}`,
    );
    expect(await bodyOf(create)).toEqual({
      model: "magi-2",
      content: [
        { type: "text", text: "Waves break against the rocks at dawn" },
      ],
      duration: 5,
      ratio: "16:9",
      resolution: "1080p",
      generate_audio: true,
    });
  });

  it.each([
    { width: 1080, height: 1920, ratio: "9:16" },
    { width: 1080, height: 1350, ratio: "3:4" },
    { width: 2560, height: 1080, ratio: "21:9" },
    { width: 1000, height: 1000, ratio: "1:1" },
  ])(
    "asks for $ratio, the nearest shape of the model to $width by $height",
    async ({ width, height, ratio }) => {
      const { creates } = await callVideo({
        respond: fakeSand({}),
        arguments: () =>
          Promise.resolve({ width_pixels: width, height_pixels: height }),
      });

      expect(await bodyOf(creates[0])).toMatchObject({ ratio });
    },
  );

  it("sends generate_audio false when the clip needs no sound", async () => {
    const { creates } = await callVideo({
      respond: fakeSand({}),
      arguments: () => Promise.resolve({ with_audio: false }),
    });

    expect(await bodyOf(creates[0])).toMatchObject({ generate_audio: false });
  });

  it("waits 10 seconds between reads, reports each read, and downloads the clip with no key", async () => {
    const { result, waits, progress, requests } = await callVideo({
      respond: fakeSand({
        polls: [
          () => taskAnswer({ status: "queued" }),
          () => taskAnswer({ status: "running" }),
        ],
      }),
    });

    expect(result.isError).toBeFalsy();
    expect(waits).toEqual([10, 10, 10]);
    expect(progress.map((update) => update.message)).toEqual([
      "Sand AI status: queued",
      "Sand AI status: queued",
      "Sand AI status: running",
    ]);
    const download = requests.find(
      (request) => request.url === fakeTask.videoUrl,
    );
    expect(download?.headers.get("authorization")).toBeNull();
  });

  it("writes the clip and reports its size and length from the file, with the cost of 0.08 US dollars a second", async () => {
    const video = fakeMp4({ width: 1920, height: 1080, durationSeconds: 6 });
    const { result, outputDirectory } = await callVideo({
      respond: fakeSand({ video }),
      arguments: () => Promise.resolve({ duration_seconds: 6 }),
    });

    const path = join(outputDirectory, "waves.mp4");
    expect(result.structuredContent).toEqual({
      files: [
        {
          path,
          kind: "video",
          duration_seconds: 6,
          width_pixels: 1920,
          height_pixels: 1080,
        },
      ],
      cost_usd: 0.48,
      cost_is_estimate: true,
    });
    expect(await readFile(path)).toEqual(video);
  });

  it("reports the requested length when the file has no header that yumekit can read", async () => {
    const { result } = await callVideo({
      respond: fakeSand({ video: Buffer.from("not an mp4") }),
      arguments: () => Promise.resolve({ duration_seconds: 10 }),
    });

    expect(result.structuredContent).toMatchObject({
      files: [{ kind: "video", duration_seconds: 10 }],
      cost_usd: 0.8,
    });
  });
});
