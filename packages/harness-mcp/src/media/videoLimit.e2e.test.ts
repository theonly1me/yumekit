import { describe, expect, it } from "vitest";
import { startHarness } from "../testing/harnessFixture.js";
import {
  generateVideo,
  sampleWithVideoLimit,
} from "../testing/videoFixture.js";

describe("the limit on generated video seconds", () => {
  it("makes a video inside the limit, and rejects one past it before any tool call", async () => {
    const harness = await startHarness({
      mediaToolsFile: sampleWithVideoLimit(4),
    });

    const inside = await generateVideo({ harness, assetId: "one", seconds: 3 });
    const requestsBefore = harness.runRequests.length;
    const past = await generateVideo({ harness, assetId: "two", seconds: 2 });

    expect(inside.isError).toBe(false);
    expect(past.isError).toBe(true);
    expect(past.data).toMatchObject({
      kind: "generated-video-limit-reached",
      used_seconds: 3,
      requested_seconds: 2,
      limit_seconds: 4,
    });
    expect(past.data["message"]).toContain(
      "limits.generatedVideoSeconds in media-tools.json",
    );
    expect(past.data["hint"]).toContain("Ask the person");
    expect(harness.runRequests).toHaveLength(requestsBefore);
    expect(harness.store.read().assets.map((asset) => asset.id)).toEqual([
      "one",
    ]);
  });

  it("does not count a reused request again", async () => {
    const harness = await startHarness({
      mediaToolsFile: sampleWithVideoLimit(4),
    });
    await generateVideo({ harness, assetId: "one", seconds: 3 });

    const reused = await harness.call({
      name: "generate_asset",
      arguments: {
        asset_id: "one-again",
        capability: "video",
        input: { prompt: "clip one", duration_seconds: 3 },
      },
    });
    const last = await generateVideo({ harness, assetId: "two", seconds: 1 });

    expect(reused.data).toMatchObject({ reused: true });
    expect(last.isError).toBe(false);
    expect(harness.runRequests).toHaveLength(2);
  });

  it("rejects each video request when the limit is 0", async () => {
    const harness = await startHarness({
      mediaToolsFile: sampleWithVideoLimit(0),
    });

    const result = await generateVideo({ harness, assetId: "one", seconds: 1 });

    expect(result.data).toMatchObject({
      kind: "generated-video-limit-reached",
      limit_seconds: 0,
    });
    expect(result.data["message"]).toContain("turned off");
    expect(harness.runRequests).toHaveLength(0);
  });

  it("uses 60 seconds when no file sets a limit", async () => {
    const harness = await startHarness();

    const result = await generateVideo({
      harness,
      assetId: "long",
      seconds: 61,
    });

    expect(result.data).toMatchObject({
      kind: "generated-video-limit-reached",
      limit_seconds: 60,
    });
    expect(harness.runRequests).toHaveLength(0);
  });
});
