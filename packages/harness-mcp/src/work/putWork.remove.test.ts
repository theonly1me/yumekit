import { describe, expect, it } from "vitest";
import { startHarness, type Harness } from "../testing/harnessFixture.js";
import { filmWork } from "./workFixture.js";

const lookScene = (sceneId: string) => ({
  scene_id: sceneId,
  title: "A look at a file",
  kit_component: "title-card",
  props: { heading: sceneId },
});

async function harnessWithLookScenes(): Promise<Harness> {
  const harness = await startHarness();
  const put = await harness.call({
    name: "put_work",
    arguments: { scenes: ["look-a", "look-b", "look-c"].map(lookScene) },
  });
  expect(put.isError).toBe(false);
  return harness;
}

function sceneIdsOf(harness: Harness): string[] {
  return harness.store
    .read()
    .scenes.map((scene) => scene.id)
    .sort();
}

describe("removal of several scenes in one change", () => {
  it("remove_scene with scene_ids removes each scene, and one undo brings all back", async () => {
    const harness = await harnessWithLookScenes();
    const before = harness.store.read().revision;

    const removed = await harness.call({
      name: "remove_scene",
      arguments: { scene_ids: ["look-a", "look-b", "look-c"] },
    });

    expect(removed.isError).toBe(false);
    expect(harness.store.read().revision).toBe(before + 1);
    expect(sceneIdsOf(harness)).toEqual([]);
    await harness.call({ name: "undo" });
    expect(sceneIdsOf(harness)).toEqual(["look-a", "look-b", "look-c"]);
  });

  it("remove_scene removes nothing when one scene of the list is still shown by a clip", async () => {
    const harness = await harnessWithLookScenes();
    await harness.call({ name: "put_work", arguments: filmWork });

    const removed = await harness.call({
      name: "remove_scene",
      arguments: { scene_ids: ["look-a", "hook"] },
    });

    expect(removed.data["kind"]).toBe("still-referenced");
    expect(sceneIdsOf(harness)).toContain("look-a");
  });

  it("put_work writes the film and removes the look scenes and an old asset as one undo step", async () => {
    const harness = await harnessWithLookScenes();
    await harness.call({
      name: "generate_asset",
      arguments: {
        asset_id: "old-tune",
        capability: "sound-effect",
        input: { prompt: "a tune", duration_seconds: 1 },
      },
    });
    const before = harness.store.read().revision;

    const put = await harness.call({
      name: "put_work",
      arguments: {
        ...filmWork,
        remove: {
          scene_ids: ["look-a", "look-b", "look-c"],
          asset_ids: ["old-tune"],
        },
      },
    });

    expect(put.isError).toBe(false);
    expect(harness.store.read().revision).toBe(before + 1);
    expect(sceneIdsOf(harness)).toEqual(["end", "hook", "proof"]);
    expect(harness.store.read().assets.map((asset) => asset.id)).toEqual([]);
    expect(put.data["removed_scene_ids"]).toEqual([
      "look-a",
      "look-b",
      "look-c",
    ]);
    await harness.call({ name: "undo" });
    expect(sceneIdsOf(harness)).toEqual(["look-a", "look-b", "look-c"]);
  });

  it("put_work refuses to remove an asset that a scene of the result still shows", async () => {
    const harness = await startHarness();
    await harness.call({
      name: "generate_asset",
      arguments: {
        asset_id: "still",
        capability: "image",
        input: { prompt: "a lake", width_pixels: 64, height_pixels: 36 },
      },
    });
    const before = harness.store.read();

    const put = await harness.call({
      name: "put_work",
      arguments: {
        scenes: [
          {
            scene_id: "lake",
            title: "Lake",
            kit_component: "image-pan",
            props: { assetId: "still" },
          },
        ],
        remove: { asset_ids: ["still"] },
      },
    });

    expect(put.data["kind"]).toBe("asset-in-use");
    expect(harness.store.read()).toEqual(before);
  });
});
