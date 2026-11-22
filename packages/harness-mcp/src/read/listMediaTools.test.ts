import { describe, expect, it } from "vitest";
import { z } from "zod";
import { startHarness } from "../testing/harnessFixture.js";
import {
  generateVideo,
  sampleWithVideoLimit,
} from "../testing/videoFixture.js";

const listedServers = z.array(
  z.object({
    server: z.string(),
    models: z.array(
      z.object({
        id: z.string(),
        accepts: z.array(z.string()).optional(),
        tested: z.boolean().optional(),
      }),
    ),
  }),
);

describe("list_media_tools models", () => {
  it("gives what each model accepts and if it was tested with yumekit", async () => {
    const harness = await startHarness();

    const listed = await harness.call({ name: "list_media_tools" });

    const servers = listedServers.parse(listed.data["servers"]);
    const sampleVideo = servers
      .find((entry) => entry.server === "sample")
      ?.models.find((model) => model.id === "sample-video");

    expect(sampleVideo).toEqual({
      id: "sample-video",
      accepts: ["first_frame", "last_frame", "reference_images"],
      tested: true,
    });
  });
});

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
