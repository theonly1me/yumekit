import { describe, expect, it } from "vitest";
import {
  createTestProject,
  readProjectFile,
  writeProjectFile,
} from "../testing/projectFixtures.js";

const appColors = {
  background: "#0c0c0d",
  text: "#ecebe8",
  muted: "#908f8b",
  accent: "#d9c9a8",
};

const fontAsset = {
  id: "geist",
  kind: "font",
  file: "assets/files/geist.woff2",
  source: { kind: "import", originalName: "Geist-Variable.woff2" },
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

describe("the own colors and font of a look", () => {
  it("setLook saves own colors in project.json, and null removes them", async () => {
    const store = await createTestProject();

    await store.applyEdits([
      { kind: "setLook", look: "midnight", colors: appColors },
    ]);
    expect(store.read().project.lookColors).toEqual(appColors);
    expect(await readProjectFile({ store, file: "project.json" })).toContain(
      '"background": "#0c0c0d"',
    );

    await store.applyEdits([{ kind: "setLook", look: "neon" }]);
    expect(store.read().project.lookColors).toEqual(appColors);

    await store.applyEdits([{ kind: "setLook", look: "neon", colors: null }]);
    expect(store.read().project.lookColors).toBeUndefined();
  });

  it("refuses a color that is not a hex color", async () => {
    const store = await createTestProject();

    const applied = await store.applyEdits([
      {
        kind: "setLook",
        look: "midnight",
        colors: { ...appColors, accent: "warm" },
      },
    ]);

    expect(applied.ok).toBe(false);
  });

  it("a look font must be a font of the project, in the same change or before", async () => {
    const store = await projectWithFont();

    const alone = await store.applyEdits([
      { kind: "setLook", look: "midnight", font: "Geist" },
    ]);
    expect(alone.ok).toBe(false);

    const together = await store.applyEdits([
      {
        kind: "setFonts",
        fonts: [{ assetId: "geist", family: "Geist", weight: [100, 900] }],
      },
      { kind: "setLook", look: "midnight", font: "Geist" },
    ]);
    expect(together.ok).toBe(true);
    expect(store.read().project.lookFont).toBe("Geist");
  });
});
