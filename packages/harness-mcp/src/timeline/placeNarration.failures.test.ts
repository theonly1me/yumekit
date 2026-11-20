import { describe, expect, it } from "vitest";
import { harnessWithSpeech } from "../testing/narrationFixture.js";

describe("place_narration failures", () => {
  it("asks for align_words when captions need word timings that the asset lacks", async () => {
    const harness = await harnessWithSpeech();
    await harness.call({
      name: "generate_asset",
      arguments: {
        asset_id: "tune",
        capability: "music",
        input: { prompt: "calm", duration_seconds: 1 },
      },
    });

    const result = await harness.call({
      name: "place_narration",
      arguments: {
        output_id: "wide",
        asset_id: "tune",
        start_frame: 0,
        with_captions: true,
      },
    });

    expect(result.data["kind"]).toBe("asset-has-no-words");
    expect(result.data["hint"]).toContain('align_words with asset_id "tune"');
  });

  it("rejects an image asset with a hint to make speech", async () => {
    const harness = await harnessWithSpeech();
    await harness.call({
      name: "generate_asset",
      arguments: {
        asset_id: "picture",
        capability: "image",
        input: { prompt: "a fox", width_pixels: 16, height_pixels: 16 },
      },
    });

    const result = await harness.call({
      name: "place_narration",
      arguments: { output_id: "wide", asset_id: "picture", start_frame: 0 },
    });

    expect(result.data["kind"]).toBe("asset-not-audio");
    expect(result.data["hint"]).toContain('capability "speech"');
  });

  it("names the overlap and a free start frame when the narration overlaps another", async () => {
    const harness = await harnessWithSpeech();
    const place = () =>
      harness.call({
        name: "place_narration",
        arguments: { output_id: "wide", asset_id: "line-one", start_frame: 0 },
      });

    await place();
    const result = await place();

    expect(result.data["kind"]).toBe("clips-overlap");
    expect(result.data["hint"]).toContain("frames 0 to 35");
    expect(result.data["hint"]).toContain(
      "start_frame after the last narration",
    );
  });
});
