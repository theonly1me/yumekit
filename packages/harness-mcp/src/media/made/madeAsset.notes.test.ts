import { access } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { makeAsset, startPricedHarness } from "../../testing/pricedFixture.js";

describe("the real length and size of a made file", () => {
  it("cuts music that is longer than asked to the asked length with a short fade, and keeps the original file", async () => {
    const { harness } = await startPricedHarness({});

    const made = await makeAsset({
      harness,
      assetId: "song",
      capability: "music",
      input: { duration_seconds: 4 },
    });

    expect(made.data).toMatchObject({
      file: "assets/files/song-fitted.wav",
      duration_frames: 120,
      real_seconds: 4,
      original_seconds: 6.7,
      fitted: true,
    });
    expect(made.text).toContain(
      "The model made 6.7 seconds for the asked 4. yumekit cut it to 4 seconds with a 0.4 second fade at the end, and kept the original file.",
    );
    const [asset] = harness.store.read().assets;
    expect(asset?.source).toMatchObject({
      fit: {
        originalFile: "assets/files/song.wav",
        seconds: 4,
        fadeOutSeconds: 0.4,
      },
    });
    await expect(
      access(join(harness.folder, "assets/files/song.wav")),
    ).resolves.toBeUndefined();
  });

  it("states the real size of a picture and how to ask for the next size", async () => {
    const { harness } = await startPricedHarness({});

    const made = await makeAsset({
      harness,
      assetId: "room",
      capability: "image",
      input: { width_pixels: 1536, height_pixels: 864 },
    });

    expect(made.data).toMatchObject({ width_pixels: 1376, height_pixels: 768 });
    expect(made.text).toContain(
      'The picture is 1376 by 768 pixels, not the asked 1536 by 864. For a larger picture, ask again with input.resolution "2K".',
    );
  });
});
