import { describe, expect, it } from "vitest";
import {
  assetVerdictsOf,
  reviewCountTextOf,
  reviewCountsOf,
  type ProjectStore,
  type TakeNote,
} from "../../index.js";
import {
  addPicture,
  firstTime,
  projectWithPlan,
  secondTime,
  thirdTime,
} from "../../testing/takeFixtures.js";

const assetIds = ["harbor", "lantern", "ferry", "pier"];

async function readyTake(): Promise<ProjectStore> {
  const store = await projectWithPlan(["a"]);
  await store.applyEdits([
    {
      kind: "openTake",
      takeId: "take-1",
      chapterId: "film",
      step: "pictures",
      at: firstTime,
    },
  ]);
  for (const assetId of assetIds) await addPicture({ store, assetId });
  const items = assetIds.map((id) => ({ kind: "asset" as const, id }));
  await store.applyEdits([
    {
      kind: "readyTake",
      takeId: "take-1",
      items,
      at: secondTime,
      costUsd: 0.2,
    },
  ]);
  return store;
}

const notes: TakeNote[] = [
  {
    itemId: "harbor",
    text: "The wall is too low.",
    tags: ["Wrong place"],
  },
  { itemId: "harbor", text: "", pin: { x: 0.4, y: 0.3 } },
  { itemId: "lantern", text: "Too bright.", dropped: true },
  { itemId: "ferry", text: "Is the fog too thick?", question: true },
  { itemId: "pier", text: "Keep this light.", approved: true, use: true },
];

describe("the verdicts of a review", () => {
  it("approves an item whose only notes are approvals, and keeps a change, a drop, and a question", async () => {
    const store = await readyTake();

    const sent = await store.applyEdits([
      { kind: "sendTake", takeId: "take-1", notes, at: thirdTime },
    ]);

    expect(sent.ok).toBe(true);
    const [take] = store.read().takes;
    expect(take?.items.map((item) => [item.id, item.approved])).toEqual([
      ["harbor", undefined],
      ["lantern", undefined],
      ["ferry", undefined],
      ["pier", true],
    ]);
    expect(Object.fromEntries(assetVerdictsOf(store.read().takes))).toEqual({
      harbor: "change",
      lantern: "dropped",
      ferry: "question",
      pier: "approved",
    });
  });

  it("counts each item once, by its verdict, in plain words", () => {
    const counts = reviewCountsOf(notes);

    expect(counts).toEqual({ change: 1, dropped: 1, question: 1 });
    expect(reviewCountTextOf(counts)).toBe(
      "1 to change, 1 to leave out, and 1 question",
    );
    expect(reviewCountTextOf({ change: 2, dropped: 0, question: 2 })).toBe(
      "2 to change and 2 questions",
    );
  });

  it("refuses a note that is both a drop and a question, and a pick that does not approve", async () => {
    const store = await readyTake();

    const sent = await store.applyEdits([
      {
        kind: "sendTake",
        takeId: "take-1",
        notes: [{ itemId: "ferry", text: "", dropped: true, question: true }],
        at: thirdTime,
      },
    ]);
    const pickedWithMistakes = await store.applyEdits([
      {
        kind: "sendTake",
        takeId: "take-1",
        notes: [{ itemId: "ferry", text: "", use: true }],
        at: thirdTime,
      },
    ]);

    expect(sent.ok || sent.failure.kind).toBe("invalid-value");
    expect(pickedWithMistakes.ok || pickedWithMistakes.failure.kind).toBe(
      "invalid-value",
    );
  });
});
