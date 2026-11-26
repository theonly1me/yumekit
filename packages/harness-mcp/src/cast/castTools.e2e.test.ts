import { describe, expect, it } from "vitest";
import { startHarness } from "../testing/harnessFixture.js";
import {
  makePictures,
  putCastMember,
  startCastHarness,
} from "../testing/castFixture.js";

describe("cast tools", () => {
  it("put_cast_member adds an entry that get_project gives, as one undo step", async () => {
    const harness = await startCastHarness();
    await makePictures({ harness, assetIds: ["mia-face"] });
    const before = harness.store.read().revision;

    await harness.call({
      name: "put_cast_member",
      arguments: {
        cast_id: "mia",
        kind: "person",
        name: "Mia",
        description: " A woman with short black hair ",
        reference_asset_ids: ["mia-face"],
      },
    });
    const project = await harness.call({ name: "get_project" });
    const added = harness.store.read().revision;
    await harness.call({ name: "undo" });

    expect(added).toBe(before + 1);
    expect(project.data["bible"]).toMatchObject({
      cast: [
        {
          id: "mia",
          kind: "person",
          name: "Mia",
          description: "A woman with short black hair",
          reference_asset_ids: ["mia-face"],
        },
      ],
    });
    expect(harness.store.read().bible.cast).toEqual([]);
  });

  it("put_cast_member replaces an entry in place and keeps its pictures when the call gives none", async () => {
    const harness = await startCastHarness();
    await makePictures({ harness, assetIds: ["mug-photo"] });
    await putCastMember({
      harness,
      castId: "lake",
      description: "A cold lake",
      pictureIds: [],
    });
    await putCastMember({
      harness,
      castId: "mug",
      description: "A blue mug",
      pictureIds: ["mug-photo"],
    });

    await harness.call({
      name: "put_cast_member",
      arguments: {
        cast_id: "lake",
        kind: "place",
        name: "Lake",
        description: "A lake at dawn",
      },
    });
    await harness.call({
      name: "put_cast_member",
      arguments: {
        cast_id: "mug",
        kind: "product",
        name: "Mug",
        description: "A blue mug with a white rim",
      },
    });

    expect(harness.store.read().bible.cast).toEqual([
      {
        id: "lake",
        kind: "place",
        name: "Lake",
        description: "A lake at dawn",
        referenceAssetIds: [],
      },
      {
        id: "mug",
        kind: "product",
        name: "Mug",
        description: "A blue mug with a white rim",
        referenceAssetIds: ["mug-photo"],
      },
    ]);
  });

  it("put_cast_member refuses a picture id that is not an image asset, and a fifth picture", async () => {
    const harness = await startHarness();
    const entry = { cast_id: "mia", kind: "person", name: "Mia" };

    const missing = await harness.call({
      name: "put_cast_member",
      arguments: {
        ...entry,
        description: "",
        reference_asset_ids: ["no-such-picture"],
      },
    });
    const tooMany = await harness.call({
      name: "put_cast_member",
      arguments: {
        ...entry,
        description: "",
        reference_asset_ids: ["a", "b", "c", "d", "e"],
      },
    });

    expect(missing.data["kind"]).toBe("asset-not-found");
    expect(tooMany.isError).toBe(true);
    expect(harness.store.read().bible.cast).toEqual([]);
  });

  it("remove_cast_member removes one entry as one undo step, and names the ids for an unknown one", async () => {
    const harness = await startCastHarness();
    await putCastMember({
      harness,
      castId: "mia",
      description: "",
      pictureIds: [],
    });
    await putCastMember({
      harness,
      castId: "leo",
      description: "",
      pictureIds: [],
    });

    const unknown = await harness.call({
      name: "remove_cast_member",
      arguments: { cast_id: "max" },
    });
    await harness.call({
      name: "remove_cast_member",
      arguments: { cast_id: "mia" },
    });
    const afterRemove = harness.store
      .read()
      .bible.cast.map((member) => member.id);
    await harness.call({ name: "undo" });

    expect(unknown.data["kind"]).toBe("cast-member-not-found");
    expect(unknown.data["hint"]).toContain("mia, leo");
    expect(afterRemove).toEqual(["leo"]);
    expect(harness.store.read().bible.cast.map((member) => member.id)).toEqual([
      "mia",
      "leo",
    ]);
  });
});
