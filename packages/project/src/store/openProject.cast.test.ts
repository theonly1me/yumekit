import { describe, expect, it } from "vitest";
import { openProject } from "../index.js";
import {
  createTestProject,
  writeProjectFile,
} from "../testing/projectFixtures.js";

async function openedCastOf(cast: object[]) {
  const store = await createTestProject();
  await writeProjectFile({
    folder: store.folder,
    file: "bible.json",
    content: JSON.stringify({ style: "", palette: [], cast, voice: "" }),
  });
  const opened = await openProject({ folder: store.folder });
  return opened.ok ? opened.value.read().bible.cast : opened.failure;
}

describe("openProject with the cast of an older project", () => {
  it("loads a bible.json with an empty cast", async () => {
    expect(await openedCastOf([])).toEqual([]);
  });

  it("loads a cast entry without a kind as a person", async () => {
    const oldEntry = {
      id: "fox",
      name: "Fox",
      description: "A red fox",
      referenceAssetIds: [],
    };

    expect(await openedCastOf([oldEntry])).toEqual([
      { ...oldEntry, kind: "person" },
    ]);
  });

  it("keeps the kind of a place and a product", async () => {
    const entries = [
      {
        id: "lake",
        kind: "place",
        name: "Lake",
        description: "A cold lake",
        referenceAssetIds: [],
      },
      {
        id: "mug",
        kind: "product",
        name: "Mug",
        description: "A blue mug",
        referenceAssetIds: [],
      },
    ];

    expect(await openedCastOf(entries)).toEqual(entries);
  });

  it("refuses a cast entry with an unknown kind", async () => {
    expect(
      await openedCastOf([
        {
          id: "fox",
          kind: "animal",
          name: "Fox",
          description: "",
          referenceAssetIds: [],
        },
      ]),
    ).toMatchObject({ kind: "invalid-file", file: "bible.json" });
  });
});
