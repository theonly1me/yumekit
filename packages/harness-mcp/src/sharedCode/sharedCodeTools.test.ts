import { mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { startHarness, type Harness } from "../testing/harnessFixture.js";

const themeCode = 'export const accent: string = "#ff3366";\n';

const sceneCode = `import { defineReactScene } from "@yumekit/scene";
import { accent } from "./_shared/theme";

export default defineReactScene(() => <h1 style={{ color: accent, fontFamily: "Display" }}>Launch</h1>);
`;

async function importFile(options: {
  harness: Harness;
  assetId: string;
  kind: string;
}) {
  const source = join(
    await mkdtemp(join(tmpdir(), "yumekit-font-")),
    "Display.woff2",
  );
  await writeFile(source, "font bytes");
  return options.harness.call({
    name: "import_asset",
    arguments: {
      asset_id: options.assetId,
      kind: options.kind,
      source_path: source,
    },
  });
}

describe("shared code and fonts", () => {
  it("lets a custom scene import shared code that put_shared_code wrote", async () => {
    const harness = await startHarness();

    const shared = await harness.call({
      name: "put_shared_code",
      arguments: { name: "theme", code: themeCode },
    });
    const scene = await harness.call({
      name: "put_scene",
      arguments: { scene_id: "title", title: "Title", code: sceneCode },
    });
    const project = await harness.call({ name: "get_project" });

    expect(shared.data).toMatchObject({ import_as: "./_shared/theme" });
    expect(scene.isError).toBe(false);
    expect(project.data).toMatchObject({ shared_code: ["theme"] });
  });

  it("refuses new shared code that breaks a scene that imports it, and names the scene", async () => {
    const harness = await startHarness();
    await harness.call({
      name: "put_shared_code",
      arguments: { name: "theme", code: themeCode },
    });
    await harness.call({
      name: "put_scene",
      arguments: { scene_id: "title", title: "Title", code: sceneCode },
    });

    const broken = await harness.call({
      name: "put_shared_code",
      arguments: { name: "theme", code: 'export const color = "#ffffff";\n' },
    });

    expect(broken.data).toMatchObject({
      kind: "scene-compile-failed",
    });
    expect(String(broken.data["message"])).toContain('breaks scene "title"');
    expect(harness.store.read().sharedCode).toEqual({ theme: themeCode });
  });

  it("set_fonts names a font asset for the whole video, and get_project lists it", async () => {
    const harness = await startHarness();
    await importFile({ harness, assetId: "display", kind: "font" });

    const set = await harness.call({
      name: "set_fonts",
      arguments: {
        fonts: [{ asset_id: "display", family: "Display", weight: 700 }],
      },
    });
    const project = await harness.call({ name: "get_project" });
    const removed = await harness.call({
      name: "remove_asset",
      arguments: { asset_id: "display" },
    });

    expect(set.isError).toBe(false);
    expect(project.data).toMatchObject({
      fonts: [{ asset_id: "display", family: "Display", weight: 700 }],
    });
    expect(removed.data).toMatchObject({
      kind: "asset-in-use",
    });
    expect(String(removed.data["message"])).toContain(
      'the font "Display" of the project',
    );
  });

  it("refuses set_fonts with an asset that is not a font", async () => {
    const harness = await startHarness();

    const set = await harness.call({
      name: "set_fonts",
      arguments: { fonts: [{ asset_id: "missing", family: "Display" }] },
    });

    expect(set.data).toMatchObject({
      kind: "font-asset-not-found",
    });
    expect(String(set.data["hint"])).toContain("import_asset");
  });
});
