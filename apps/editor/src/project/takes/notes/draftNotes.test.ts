import { describe, expect, it } from "vitest";
import { noteCountOf, sentNotesOf, type TakeDraft } from "./draftNotes.js";

const draft: TakeDraft = {
  notes: [
    {
      id: "a",
      itemId: "harbor",
      place: { kind: "pin", x: 0.62, y: 0.35 },
      text: " Make the wall taller. ",
    },
    {
      id: "b",
      itemId: "strings",
      place: { kind: "moment", seconds: 1.2 },
      text: "The swell comes late.",
    },
    {
      id: "c",
      itemId: "story",
      place: { kind: "quote", quote: "The fog arrives early." },
      text: "Say why it is early.",
    },
    {
      id: "d",
      itemId: "harbor",
      place: { kind: "pin", x: 0.1, y: 0.1 },
      text: "",
    },
  ],
  dropped: ["lantern"],
};

describe("the notes that a take sends", () => {
  it("sends each written note with its pin, moment, or quote, and each dropped item", () => {
    expect(sentNotesOf(draft)).toEqual([
      {
        item_id: "harbor",
        text: "Make the wall taller.",
        pin: { x: 0.62, y: 0.35 },
      },
      { item_id: "strings", text: "The swell comes late.", seconds: 1.2 },
      {
        item_id: "story",
        text: "Say why it is early.",
        quote: "The fog arrives early.",
      },
      { item_id: "lantern", text: "", dropped: true },
    ]);
  });

  it("leaves out a pin with no words, so the count shows only what goes", () => {
    expect(noteCountOf({ draft, itemId: "harbor" })).toBe(1);
  });
});
