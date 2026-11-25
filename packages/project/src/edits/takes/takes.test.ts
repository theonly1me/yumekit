import { access } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  assetVerdictsOf,
  openProject,
  type Edit,
  type ProjectStore,
} from "../../index.js";
import {
  createTestProject,
  readProjectFile,
} from "../../testing/projectFixtures.js";
import {
  addPicture,
  firstTime,
  projectWithPlan,
  secondTime,
  thirdTime,
} from "../../testing/takeFixtures.js";

const openPictures: Edit = {
  kind: "openTake",
  takeId: "take-1",
  chapterId: "film",
  step: "pictures",
  at: firstTime,
};

async function filledTake(): Promise<ProjectStore> {
  const store = await projectWithPlan(["a", "b"]);
  await store.applyEdits([openPictures]);
  for (const assetId of ["a-start", "b-start", "harbor"]) {
    await addPicture({ store, assetId, shotId: assetId.split("-")[0] });
    await store.applyEdits([
      { kind: "fillTake", items: [{ kind: "asset", id: assetId }] },
    ]);
  }
  return store;
}

const readyItems = ["a-start", "b-start", "harbor"].map((id) => ({
  kind: "asset" as const,
  id,
  note: `The lead's note on ${id}.`,
}));

const readyEdit: Edit = {
  kind: "readyTake",
  takeId: "take-1",
  items: readyItems,
  at: secondTime,
  costUsd: 0.27,
  nextStepEstimateUsd: 0.56,
};

describe("takes", () => {
  it("a project with no takes writes no takes.json and opens as before", async () => {
    const store = await createTestProject();
    await expect(access(join(store.folder, "takes.json"))).rejects.toThrow();
    const opened = await openProject({ folder: store.folder });
    expect(opened.ok && opened.value.read().takes).toEqual([]);
  });

  it("a take collects the assets added while it is open, and takes.json keeps it", async () => {
    const store = await filledTake();
    await store.applyEdits([readyEdit]);
    expect(
      JSON.parse(await readProjectFile({ store, file: "takes.json" })),
    ).toEqual({
      takes: [
        {
          id: "take-1",
          chapterId: "film",
          step: "pictures",
          number: 1,
          state: "ready",
          openedAt: firstTime,
          readyAt: secondTime,
          items: readyItems,
          notes: [],
          costUsd: 0.27,
          nextStepEstimateUsd: 0.56,
        },
      ],
    });
    const opened = await openProject({ folder: store.folder });
    expect(opened.ok && opened.value.read().takes).toEqual(store.read().takes);
  });

  it("fillTake with no open take changes nothing", async () => {
    const store = await projectWithPlan(["a"]);
    await addPicture({ store, assetId: "a-start", shotId: "a" });
    const before = store.read().revision;
    await store.applyEdits([
      { kind: "fillTake", items: [{ kind: "asset", id: "a-start" }] },
    ]);
    expect(store.read().revision).toBe(before);
  });

  it("an empty open take gives way to a new one, and a filled one refuses", async () => {
    const store = await projectWithPlan(["a"]);
    await store.applyEdits([openPictures]);
    await store.applyEdits([
      { ...openPictures, takeId: "take-2", step: "clips" },
    ]);
    expect(store.read().takes.map((take) => [take.id, take.number])).toEqual([
      ["take-2", 1],
    ]);
    await addPicture({ store, assetId: "a-start", shotId: "a" });
    await store.applyEdits([
      { kind: "fillTake", items: [{ kind: "asset", id: "a-start" }] },
    ]);
    const third = await store.applyEdits([
      { ...openPictures, takeId: "take-3" },
    ]);
    expect(third.ok || third.failure.kind).toBe("invalid-value");
  });

  it("a send approves each item with no note and keeps each note", async () => {
    const store = await filledTake();
    await store.applyEdits([readyEdit]);
    const pin = { x: 0.75, y: 0.62 };
    await store.applyEdits([
      {
        kind: "sendTake",
        takeId: "take-1",
        notes: [
          { itemId: "a-start", text: "Make the coat green.", pin },
          { itemId: "harbor", text: "", dropped: true },
        ],
        at: thirdTime,
      },
    ]);
    const [take] = store.read().takes;
    expect(take?.state).toBe("sent");
    expect(take?.items.map((item) => [item.id, item.approved])).toEqual([
      ["a-start", undefined],
      ["b-start", true],
      ["harbor", undefined],
    ]);
    expect([...assetVerdictsOf(store.read().takes)]).toEqual([
      ["b-start", "approved"],
      ["a-start", "change"],
      ["harbor", "dropped"],
    ]);
  });

  it("a send refuses a take that is not ready and a note on no item", async () => {
    const store = await filledTake();
    const send: Edit = {
      kind: "sendTake",
      takeId: "take-1",
      notes: [],
      at: thirdTime,
    };
    const early = await store.applyEdits([send]);
    expect(early.ok || early.failure.kind).toBe("invalid-value");
    await store.applyEdits([readyEdit]);
    const stray = await store.applyEdits([
      { ...send, notes: [{ itemId: "nowhere", text: "Change it." }] },
    ]);
    expect(stray.ok || stray.failure.kind).toBe("not-found");
  });

  it("undo steps back through the send, the ready, and each fill", async () => {
    const store = await filledTake();
    await store.applyEdits([readyEdit]);
    await store.applyEdits([
      { kind: "sendTake", takeId: "take-1", notes: [], at: thirdTime },
    ]);
    const states = [];
    for (let step = 0; step < 3; step += 1) {
      await store.undo();
      const [take] = store.read().takes;
      states.push([take?.state, take?.items.length]);
    }
    expect(states).toEqual([
      ["ready", 3],
      ["open", 3],
      ["open", 2],
    ]);
  });
});
