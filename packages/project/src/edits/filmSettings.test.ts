import { describe, expect, it } from "vitest";
import { openProject } from "../index.js";
import {
  createTestProject,
  readProjectFile,
  writeProjectFile,
} from "../testing/projectFixtures.js";

const fontAsset = {
  id: "display",
  kind: "font",
  file: "assets/files/display.woff2",
  source: { kind: "import", originalName: "display.woff2" },
} as const;

async function projectWithFont() {
  const store = await createTestProject();
  await writeProjectFile({
    folder: store.folder,
    file: fontAsset.file,
    content: "font",
  });
  await store.applyEdits([{ kind: "addAsset", asset: fontAsset }]);
  return store;
}

describe("tempo, fonts, and shared code of a project", () => {
  it("setTempo writes the tempo to project.json, and undo removes it", async () => {
    const store = await createTestProject();

    await store.applyEdits([{ kind: "setTempo", tempo: 120 }]);

    expect(store.read().project.tempo).toBe(120);
    expect(await readProjectFile({ store, file: "project.json" })).toContain(
      '"tempo": 120',
    );
    await store.undo();
    expect(store.read().project.tempo).toBeUndefined();
  });

  it("refuses a tempo outside 60 to 200", async () => {
    const store = await createTestProject();

    const applied = await store.applyEdits([{ kind: "setTempo", tempo: 240 }]);

    expect(applied).toMatchObject({
      ok: false,
      failure: { kind: "invalid-value" },
    });
  });

  it("setFonts names a font asset, and the asset cannot be removed while the project names it", async () => {
    const store = await projectWithFont();

    await store.applyEdits([
      {
        kind: "setFonts",
        fonts: [{ assetId: "display", family: "Display", weight: 700 }],
      },
    ]);
    const removed = await store.applyEdits([
      { kind: "removeAsset", assetId: "display" },
    ]);

    expect(store.read().project.fonts).toEqual([
      { assetId: "display", family: "Display", weight: 700 },
    ]);
    expect(removed).toMatchObject({
      ok: false,
      failure: {
        kind: "still-referenced",
      },
    });
    expect(removed.ok ? "" : removed.failure.message).toContain("Display");
  });

  it("refuses a font that names an asset that is not a font", async () => {
    const store = await createTestProject();

    const applied = await store.applyEdits([
      { kind: "setFonts", fonts: [{ assetId: "missing", family: "Display" }] },
    ]);

    expect(applied).toMatchObject({
      ok: false,
      failure: { kind: "not-found" },
    });
  });

  it("putSharedCode writes scenes/_shared/<name>.tsx, and openProject reads it back with no scene for the folder", async () => {
    const store = await createTestProject();
    const code = 'export const accent = "#ff3366";\n';

    await store.applyEdits([{ kind: "putSharedCode", name: "theme", code }]);
    const opened = await openProject({ folder: store.folder });

    expect(
      await readProjectFile({ store, file: "scenes/_shared/theme.tsx" }),
    ).toBe(code);
    expect(opened.ok && opened.value.read().sharedCode).toEqual({
      theme: code,
    });
    expect(opened.ok && opened.value.read().scenes).toEqual([]);
  });
});
