import { describe, expect, it } from "vitest";
import type { Take } from "../format/takes.js";
import {
  inUseByPlaceOf,
  placeKeyOf,
  placeOf,
  type PlaceAsset,
  type PlaceFacts,
} from "./places.js";

function asset(fields: Partial<PlaceAsset> & Pick<PlaceAsset, "id">) {
  return { kind: "image", shotId: undefined, ...fields };
}

const firstTake: Take = {
  id: "take-1",
  chapterId: "film",
  step: "pictures",
  number: 1,
  state: "sent",
  openedAt: "2026-11-26T10:00:00.000Z",
  sentAt: "2026-11-26T10:05:00.000Z",
  items: [
    { kind: "asset", id: "harbor-start", approved: true },
    { kind: "asset", id: "lamp" },
  ],
  notes: [{ itemId: "lamp", text: "Dimmer." }],
};

const secondTake: Take = {
  ...firstTake,
  id: "take-2",
  number: 2,
  sentAt: "2026-11-26T10:20:00.000Z",
  items: [
    { kind: "asset", id: "harbor-start-2", replaces: "harbor-start" },
    { kind: "asset", id: "lamp-2", replaces: "lamp" },
  ],
  notes: [
    { itemId: "harbor-start", text: "", approved: true, use: true },
    { itemId: "lamp-2", text: "", approved: true },
  ],
};

const facts: PlaceFacts = {
  assets: new Map(
    [
      asset({ id: "harbor-start", shotId: "harbor" }),
      asset({ id: "harbor-start-2", shotId: "harbor" }),
      asset({ id: "lamp" }),
      asset({ id: "lamp-2" }),
      asset({ id: "harbor-clip", kind: "video", shotId: "harbor" }),
      asset({ id: "theme", kind: "audio" }),
      asset({ id: "theme-2", kind: "audio" }),
    ].map((each) => [each.id, each]),
  ),
  sheets: [],
  takes: [firstTake, secondTake],
};

describe("the places of a film and the version in use", () => {
  it("gives a version the place of its shot, or the place of the item it replaces", () => {
    expect(placeOf({ facts, assetId: "harbor-start-2" })).toEqual({
      kind: "shot-picture",
      shotId: "harbor",
    });
    expect(placeOf({ facts, assetId: "lamp-2" })).toEqual({
      kind: "versions",
      firstId: "lamp",
    });
    expect(placeOf({ facts, assetId: "theme" })).toEqual({ kind: "music" });
  });

  it("keeps an older version that the person marked Looks right over a newer one", () => {
    const inUse = inUseByPlaceOf({ facts, usedIds: new Set() });

    expect(
      inUse.get(placeKeyOf({ kind: "shot-picture", shotId: "harbor" })),
    ).toBe("harbor-start");
  });

  it("puts the newest version with no review in use, until a Looks right picks another", () => {
    const unreviewed = inUseByPlaceOf({
      facts,
      usedIds: new Set(),
      draftDefaults: ["lamp-2"],
    });
    const picked = inUseByPlaceOf({
      facts,
      usedIds: new Set(),
      draftDefaults: ["lamp-2"],
      draftPicks: ["lamp"],
    });

    expect(unreviewed.get("versions:lamp")).toBe("lamp-2");
    expect(picked.get("versions:lamp")).toBe("lamp");
  });

  it("moves In use to a pick of the draft, and keeps the film's use where nothing is picked", () => {
    const inUse = inUseByPlaceOf({
      facts,
      usedIds: new Set(["theme", "harbor-clip"]),
      draftPicks: ["harbor-start-2"],
    });

    expect(Object.fromEntries(inUse)).toEqual({
      "shot-picture:harbor": "harbor-start-2",
      "shot-clip:harbor": "harbor-clip",
      music: "theme",
    });
  });
});
