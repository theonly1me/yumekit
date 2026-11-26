import { stat } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { harnessWithYoutubeAndTiktok } from "../testing/platformFixture.js";
import { probeVideo } from "../testing/probeVideo.js";

const renderTimeout = 120_000;

describe("render_video with a smaller file", () => {
  it(
    "writes a file under the size with its own name, at 720 lines when asked, and gives its bytes",
    async () => {
      const harness = await harnessWithYoutubeAndTiktok();

      const rendered = await harness.call({
        name: "render_video",
        arguments: {
          output_id: "wide",
          largest_megabytes: 1,
          short_side_pixels: 720,
        },
      });

      const file = join(
        harness.folder,
        "renders",
        "harness-test-youtube-under-1mb.mp4",
      );
      const bytes = (await stat(file)).size;
      expect(rendered.data).toMatchObject({
        file,
        files: [{ platform_id: "youtube", file }],
        bytes,
        width_pixels: 1280,
        height_pixels: 720,
      });
      expect(bytes).toBeLessThanOrEqual(1_000_000);
      const [video] = await probeVideo(file);
      expect(video).toMatchObject({ width: 1280, height: 720 });
    },
    renderTimeout,
  );

  it("refuses a smaller file of one chapter, because a chapter renders as the cut of its take", async () => {
    const harness = await harnessWithYoutubeAndTiktok();

    const rendered = await harness.call({
      name: "render_video",
      arguments: {
        output_id: "wide",
        chapter_id: "dock",
        largest_megabytes: 10,
      },
    });

    expect(rendered.isError).toBe(true);
    expect(rendered.data).toMatchObject({ kind: "invalid-input" });
  });
});
