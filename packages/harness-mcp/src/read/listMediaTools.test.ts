import { describe, expect, it } from "vitest";
import { startHarness } from "../testing/harnessFixture.js";
import {
  generateVideo,
  sampleWithVideoLimit,
} from "../testing/videoFixture.js";

describe("list_media_tools generated video", () => {
  it("gives the default limit and 0 used seconds in a new project", async () => {
    const harness = await startHarness();

    const listed = await harness.call({ name: "list_media_tools" });

    expect(listed.data["generated_video"]).toEqual({
      limit_seconds: 30,
      used_seconds: 0,
    });
  });

  it("counts each generated video file once, the same way as the limit check", async () => {
    const harness = await startHarness({
      mediaToolsFile: sampleWithVideoLimit(20),
    });
    await generateVideo({ harness, assetId: "one", seconds: 2 });
    await harness.call({
      name: "generate_asset",
      arguments: {
        asset_id: "one-again",
        capability: "video",
        input: { prompt: "clip one", duration_seconds: 2 },
      },
    });
    await harness.call({
      name: "generate_asset",
      arguments: {
        asset_id: "still",
        capability: "image",
        input: { prompt: "a fox", width_pixels: 64, height_pixels: 36 },
      },
    });

    const listed = await harness.call({ name: "list_media_tools" });

    expect(listed.data["generated_video"]).toEqual({
      limit_seconds: 20,
      used_seconds: 2,
    });
    expect(listed.text).toContain("Generated video: 2 of 20 seconds used.");
  });
});
