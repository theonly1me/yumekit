import { readFile, stat } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { harnessWithYoutubeAndTiktok } from "../testing/platformFixture.js";
import { probeVideo } from "../testing/probeVideo.js";

const renderTimeout = 120_000;

describe("make_sharper_copy", () => {
  it(
    "writes a larger copy next to each chosen platform file and keeps the normal file",
    async () => {
      const harness = await harnessWithYoutubeAndTiktok();
      await harness.call({
        name: "add_platform",
        arguments: { platform_id: "instagram-reel" },
      });
      await harness.call({
        name: "render_video",
        arguments: { output_id: "tall", scale: 0.25, frame_count: 3 },
      });
      const renders = join(harness.folder, "renders");
      const normal = join(renders, "harness-test-tiktok.mp4");
      const normalBytes = await readFile(normal);

      const result = await harness.call({
        name: "make_sharper_copy",
        arguments: { output_id: "tall", platform_ids: ["instagram-reel"] },
      });

      const sharper = join(renders, "harness-test-instagram-reel-sharper.mp4");
      expect(result.data).toMatchObject({
        files: [{ file: sharper, platform_id: "instagram-reel" }],
        server: "sample",
        width_pixels: 540,
        height_pixels: 960,
      });
      const [video] = await probeVideo(sharper);
      expect(video).toMatchObject({ width: 540, height: 960 });
      expect(await readFile(normal)).toEqual(normalBytes);
      await expect(
        stat(join(renders, "harness-test-tiktok-sharper.mp4")),
      ).rejects.toThrow();
    },
    renderTimeout,
  );

  it("fails with a hint before the output has a rendered file", async () => {
    const harness = await harnessWithYoutubeAndTiktok();

    const result = await harness.call({
      name: "make_sharper_copy",
      arguments: { output_id: "tall" },
    });

    expect(result.data).toMatchObject({
      kind: "render-not-found",
      hint: "Call render_video for the output first, then make_sharper_copy.",
    });
    expect(harness.runRequests).toHaveLength(0);
  });

  it("names the platforms of the output for an unknown platform", async () => {
    const harness = await harnessWithYoutubeAndTiktok();

    const result = await harness.call({
      name: "make_sharper_copy",
      arguments: { output_id: "tall", platform_ids: ["square"] },
    });

    expect(result.data).toMatchObject({
      kind: "platform-not-found",
      hint: "Use these platform ids: tiktok.",
    });
  });
});
