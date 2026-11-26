import { describe, expect, it } from "vitest";
import {
  addMoment,
  addPin,
  emptyItemDraft,
  pickVerdict,
  toggleTag,
  toggleUse,
  writeMark,
  writeNote,
  type ItemDraft,
} from "./itemDrafts.js";
import { draftCountsOf, sentNotesOf } from "./sentNotes.js";

function draftWith(...changes: ((draft: ItemDraft) => ItemDraft)[]) {
  return changes.reduce((...[draft, change]) => change(draft), emptyItemDraft);
}

const harbor = draftWith(
  addPin({ id: "pin-a", x: 0.62, y: 0.35 }),
  writeMark({ kind: "pins", id: "pin-a", text: " Make the wall taller. " }),
  toggleTag("Wrong place"),
  writeNote("The harbor looks too small."),
);

const drafts = new Map<string, ItemDraft>([
  ["harbor", harbor],
  [
    "strings",
    draftWith(
      pickVerdict("question"),
      addMoment({ id: "moment-a", seconds: 1.24 }),
      writeMark({ kind: "moments", id: "moment-a", text: "Too loud?" }),
    ),
  ],
  ["lantern", draftWith(pickVerdict("dropped"))],
  ["ferry", draftWith(pickVerdict("approved"))],
  ["pier", draftWith(pickVerdict("change"))],
  ["gull", emptyItemDraft],
  ["gate", toggleUse(emptyItemDraft)],
]);

const itemIds = [
  "harbor",
  "strings",
  "lantern",
  "ferry",
  "pier",
  "gull",
  "gate",
];

describe("the notes that a review sends", () => {
  it("gives a pin, a tag, or a note the verdict Has mistakes when the item has none", () => {
    expect(harbor.verdict).toBe("change");
    expect(
      draftWith(pickVerdict("question"), toggleTag("Bad hands")).verdict,
    ).toBe("question");
  });

  it("sends each verdict with its tags, note, pins, and moments, a Use this pick, and nothing for an item with no review", () => {
    expect(sentNotesOf({ drafts, itemIds })).toEqual([
      {
        item_id: "harbor",
        text: "The harbor looks too small.",
        tags: ["Wrong place"],
      },
      {
        item_id: "harbor",
        text: "Make the wall taller.",
        pin: { x: 0.62, y: 0.35 },
      },
      { item_id: "strings", question: true, text: "Too loud?", seconds: 1.2 },
      { item_id: "lantern", dropped: true, text: "" },
      { item_id: "pier", text: "" },
      { item_id: "gate", approved: true, text: "", use: true },
    ]);
  });

  it("counts each item once by its verdict, and counts a pick apart from the changes", () => {
    expect(draftCountsOf({ drafts, itemIds })).toEqual({
      change: 2,
      question: 1,
      dropped: 1,
      use: 1,
    });
  });

  it("sends only the items that the take shows", () => {
    expect(
      sentNotesOf({ drafts, itemIds: ["lantern"] }).map((note) => note.item_id),
    ).toEqual(["lantern"]);
  });
});
