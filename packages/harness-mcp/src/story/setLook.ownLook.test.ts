import { mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { startHarness, type Harness } from "../testing/harnessFixture.js";

const appColors = {
  background: "#0c0c0d",
  text: "#ecebe8",
  muted: "#908f8b",
  accent: "#d9c9a8",
};

async function importFont(harness: Harness): Promise<void> {
  const source = join(
    await mkdtemp(join(tmpdir(), "yumekit-font-")),
    "Geist-Variable.woff2",
  );
  await writeFile(source, "font bytes");
  await harness.call({
    name: "import_asset",
    arguments: { asset_id: "geist", kind: "font", source_path: source },
  });
}

describe("the own colors and font of the kit scenes", () => {
  it("set_look takes the colors of the person, and get_work names them for the kit scenes", async () => {
    const harness = await startHarness();

    const changed = await harness.call({
      name: "set_look",
      arguments: { look: "midnight", colors: appColors },
    });
    const work = await harness.call({ name: "get_work" });

    expect(changed.isError).toBe(false);
    expect(harness.store.read().project.lookColors).toEqual(appColors);
    expect(work.text).toContain(
      "Kit scene colors: background #0c0c0d, text #ecebe8, muted #908f8b, accent #d9c9a8.",
    );
  });

  it("set_look warns when the text color is hard to read on the background", async () => {
    const harness = await startHarness();

    const changed = await harness.call({
      name: "set_look",
      arguments: { colors: { ...appColors, muted: "#202022" } },
    });

    expect(changed.data["warnings"]).toEqual([
      expect.stringContaining("The muted color has a contrast of"),
    ]);
  });

  it("set_fonts with look_font loads the font and gives it to the kit scenes as one undo step", async () => {
    const harness = await startHarness();
    await importFont(harness);
    const before = harness.store.read().revision;

    const set = await harness.call({
      name: "set_fonts",
      arguments: {
        fonts: [{ asset_id: "geist", family: "Geist", weight: [100, 900] }],
        look_font: "Geist",
      },
    });

    expect(set.isError).toBe(false);
    expect(harness.store.read().revision).toBe(before + 1);
    expect(harness.store.read().project.lookFont).toBe("Geist");
    await harness.call({ name: "set_fonts", arguments: { fonts: [] } });
    expect(harness.store.read().project.lookFont).toBeUndefined();
  });

  it("set_look refuses a font that the project has not loaded", async () => {
    const harness = await startHarness();

    const changed = await harness.call({
      name: "set_look",
      arguments: { font: "Geist" },
    });

    expect(changed.data["kind"]).toBe("not-found");
    expect(changed.text).toContain("set_fonts");
  });
});
