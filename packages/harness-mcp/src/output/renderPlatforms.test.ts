import { readFile, stat } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { harnessWithYoutubeAndTiktok } from "../testing/platformFixture.js";
import { probeVideo } from "../testing/probeVideo.js";
import { fileNameOfProject } from "./platformFiles.js";

const renderTimeout = 120_000;

describe("render_video with platforms", () => {
  it(
    "renders once and writes one file for each platform, with the same bytes",
    async () => {
      const harness = await harnessWithYoutubeAndTiktok();
      await harness.call({
        name: "add_platform",
        arguments: { platform_id: "instagram-reel" },
      });

      const rendered = await harness.call({
        name: "render_video",
        arguments: { output_id: "tall", scale: 0.25, frame_count: 3 },
      });

      const renders = join(harness.folder, "renders");
      const tiktok = join(renders, "harness-test-tiktok.mp4");
      const reel = join(renders, "harness-test-instagram-reel.mp4");
      expect(rendered.data).toMatchObject({
        file: tiktok,
        files: [
          { platform_id: "tiktok", file: tiktok },
          { platform_id: "instagram-reel", file: reel },
        ],
      });
      expect(await readFile(reel)).toEqual(await readFile(tiktok));
      expect((await stat(tiktok)).nlink).toBe(2);
      const [video] = await probeVideo(reel);
      expect(video).toMatchObject({ width: 270, height: 480 });
    },
    renderTimeout,
  );

  it(
    "keeps the file name of today for an output with no platform",
    async () => {
      const harness = await harnessWithYoutubeAndTiktok();
      for (const platformId of ["tiktok", "youtube"]) {
        await harness.call({
          name: "remove_platform",
          arguments: { platform_id: platformId },
        });
      }

      const rendered = await harness.call({
        name: "render_video",
        arguments: { output_id: "wide", scale: 0.25, frame_count: 3 },
      });

      const file = join(harness.folder, "renders", "wide.mp4");
      expect(rendered.data).toMatchObject({ file, files: [{ file }] });
    },
    renderTimeout,
  );
});

describe("the project name in a file name", () => {
  it.each([
    { name: "Harness test", expected: "harness-test" },
    { name: "  My Video: Part 2!  ", expected: "my-video-part-2" },
    { name: "夢 キット", expected: "夢-キット" },
    { name: "???", expected: "video" },
    { name: "a".repeat(80), expected: "a".repeat(64) },
  ])("$name becomes $expected", ({ name, expected }) => {
    expect(fileNameOfProject(name)).toBe(expected);
  });
});
