import { describe, expect, it } from "vitest";
import { startHarness } from "../testing/harnessFixture.js";

describe("list_media_requests", () => {
  it("lists a made picture and a clip that the video limit refused, the newest first, with the prompt as sent", async () => {
    const harness = await startHarness({
      mediaToolsFile: { limits: { generatedVideoSeconds: 1 } },
    });
    await harness.call({
      name: "generate_asset",
      arguments: {
        asset_id: "fox",
        capability: "image",
        input: { prompt: "A red fox", width_pixels: 32, height_pixels: 18 },
      },
    });
    await harness.call({
      name: "generate_asset",
      arguments: {
        asset_id: "fox-run",
        capability: "video",
        input: { prompt: "The fox runs", duration_seconds: 2 },
      },
    });

    const all = await harness.call({ name: "list_media_requests" });
    const failed = await harness.call({
      name: "list_media_requests",
      arguments: { failed_only: true },
    });

    expect(all.data).toMatchObject({
      total: 2,
      failed: 1,
      requests: [
        {
          asset_id: "fox-run",
          capability: "video",
          prompt_from_you: "The fox runs",
          settings: { duration_seconds: 2 },
          failure: { kind: "generated-video-limit-reached" },
        },
        {
          asset_id: "fox",
          server: "sample",
          prompt_from_you: "A red fox",
          files: ["assets/files/fox.png"],
        },
      ],
    });
    expect(all.text).toContain(
      "Media requests in this project: 2, of which 1 failed.",
    );
    expect(failed.data["requests"]).toHaveLength(1);
  });
});
