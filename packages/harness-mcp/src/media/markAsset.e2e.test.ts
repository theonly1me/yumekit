import { copyFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { startHarness, type Harness } from "../testing/harnessFixture.js";

const preview = {
  name: "the preview",
  region: { x: 0.25, y: 0.1, width: 0.5, height: 0.4 },
  seconds: 2,
};

async function imageSource(harness: Harness): Promise<string> {
  const made = await harness.call({
    name: "generate_asset",
    arguments: {
      asset_id: "made",
      capability: "image",
      input: { prompt: "a screen", width_pixels: 64, height_pixels: 40 },
    },
  });
  const copy = join(harness.folder, "..", "screen.png");
  await copyFile(join(harness.folder, String(made.data["file"])), copy);
  return copy;
}

async function harnessWithScreen(marks?: unknown[]) {
  const harness = await startHarness();
  const imported = await harness.call({
    name: "import_asset",
    arguments: {
      asset_id: "screen",
      kind: "image",
      source_path: await imageSource(harness),
      ...(marks === undefined ? {} : { marks }),
    },
  });
  expect(imported.isError).toBe(false);
  return harness;
}

function marksOf(harness: Harness) {
  return harness.store.read().assets.find((asset) => asset.id === "screen")
    ?.marks;
}

describe("marks on an asset", () => {
  it("import_asset keeps the marks that it gets", async () => {
    const harness = await harnessWithScreen([preview]);

    expect(marksOf(harness)).toEqual([preview]);
  });

  it("mark_asset adds a mark, replaces one with the same name, and removes one", async () => {
    const harness = await harnessWithScreen();

    await harness.call({
      name: "mark_asset",
      arguments: { asset_id: "screen", ...preview },
    });
    await harness.call({
      name: "mark_asset",
      arguments: { asset_id: "screen", name: "the preview", seconds: 4 },
    });
    expect(marksOf(harness)).toEqual([{ name: "the preview", seconds: 4 }]);

    await harness.call({
      name: "mark_asset",
      arguments: { asset_id: "screen", name: "the preview", remove: true },
    });
    expect(marksOf(harness)).toBeUndefined();
  });

  it("mark_asset refuses a mark with no region and no time", async () => {
    const harness = await harnessWithScreen();

    const result = await harness.call({
      name: "mark_asset",
      arguments: { asset_id: "screen", name: "empty" },
    });

    expect(result.isError).toBe(true);
    expect(result.text).toContain("mark-is-empty");
  });

  it("list_assets gives the marks of each asset", async () => {
    const harness = await harnessWithScreen([preview]);

    const listed = await harness.call({ name: "list_assets", arguments: {} });

    expect(listed.data["assets"]).toContainEqual(
      expect.objectContaining({ id: "screen", marks: [preview] }),
    );
  });

  it("put_scene refuses a footage mark that the asset does not have", async () => {
    const harness = await harnessWithScreen([preview]);
    const putFootage = (mark: string) =>
      harness.call({
        name: "put_scene",
        arguments: {
          scene_id: "screen-shot",
          title: "The screen",
          kit_component: "footage",
          props: { assetId: "screen", mark },
        },
      });

    const missing = await putFootage("the export");
    const known = await putFootage("The Preview");

    expect(missing.isError).toBe(true);
    expect(missing.text).toContain('has no mark "the export"');
    expect(missing.text).toContain('"the preview"');
    expect(known.isError).toBe(false);
  });
});
