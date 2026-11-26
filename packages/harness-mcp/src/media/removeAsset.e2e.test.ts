import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { startHarness, type Harness } from "../testing/harnessFixture.js";

async function madePicture(harness: Harness): Promise<void> {
  await harness.call({
    name: "generate_asset",
    arguments: {
      asset_id: "still",
      capability: "image",
      input: { prompt: "a lake", width_pixels: 64, height_pixels: 48 },
    },
  });
}

async function madeTune(harness: Harness): Promise<void> {
  await harness.call({
    name: "generate_asset",
    arguments: {
      asset_id: "tune",
      capability: "music",
      input: { prompt: "calm", duration_seconds: 1 },
    },
  });
}

function assetIdsOf(harness: Harness): string[] {
  return harness.store.read().assets.map((asset) => asset.id);
}

describe("remove_asset", () => {
  it("removes an asset that nothing uses as one undo step, and keeps its file", async () => {
    const harness = await startHarness();
    await madePicture(harness);
    const [asset] = harness.store.read().assets;
    if (asset === undefined) throw new Error("The picture was not made");

    const removed = await harness.call({
      name: "remove_asset",
      arguments: { asset_id: "still" },
    });

    expect(removed.isError).toBe(false);
    expect(assetIdsOf(harness)).toEqual([]);
    expect(existsSync(join(harness.folder, asset.file))).toBe(true);
    await harness.call({ name: "undo" });
    expect(assetIdsOf(harness)).toEqual(["still"]);
  });

  it("fails with asset-in-use and names the scene and the clip that use the asset", async () => {
    const harness = await startHarness();
    await madePicture(harness);
    await madeTune(harness);
    await harness.call({
      name: "put_scene",
      arguments: {
        scene_id: "lake",
        title: "Lake",
        kit_component: "image-pan",
        props: { assetId: "still" },
      },
    });
    await harness.call({
      name: "set_timeline",
      arguments: {
        output_id: "wide",
        tracks: [
          {
            id: "music",
            kind: "audio",
            clips: [
              {
                id: "m1",
                asset_id: "tune",
                start_frame: 0,
                duration_frames: 30,
              },
            ],
          },
        ],
      },
    });

    const picture = await harness.call({
      name: "remove_asset",
      arguments: { asset_id: "still" },
    });
    const tune = await harness.call({
      name: "remove_asset",
      arguments: { asset_id: "tune" },
    });

    expect(picture.data).toMatchObject({
      kind: "asset-in-use",
      message: 'The asset "still" is used by: scene "lake".',
    });
    expect(tune.data).toMatchObject({
      kind: "asset-in-use",
      message:
        'The asset "tune" is used by: clip "m1" on track "music" of output "wide".',
    });
    expect(assetIdsOf(harness)).toEqual(["still", "tune"]);
  });

  it("fails with asset-not-found for an unknown id", async () => {
    const harness = await startHarness();

    const result = await harness.call({
      name: "remove_asset",
      arguments: { asset_id: "missing" },
    });

    expect(result.data).toMatchObject({ kind: "asset-not-found" });
  });
});
