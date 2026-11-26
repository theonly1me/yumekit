import { describe, expect, it } from "vitest";
import {
  clip,
  picture,
  readyPictures,
  startTakeHarness,
} from "../testing/takeHarness.js";

describe("a round of the lead's work as a take", { timeout: 60_000 }, () => {
  it("collects each picture made while the take is open, but not a voice and not what came before", async () => {
    const harness = await startTakeHarness();
    await harness.call({
      name: "generate_asset",
      arguments: picture("before"),
    });
    const opened = await harness.call({
      name: "open_take",
      arguments: { step: "pictures" },
    });
    await harness.call({
      name: "generate_assets",
      arguments: { calls: [picture("harbor"), picture("ferry")] },
    });
    await harness.call({
      name: "generate_asset",
      arguments: {
        asset_id: "line",
        capability: "speech",
        input: { text: "The fog came early." },
      },
    });

    expect(opened.data).toMatchObject({
      take_id: "take-1",
      number: 1,
      chapter_id: "film",
    });
    const [take] = harness.store.read().takes;
    expect(take?.items.map((item) => item.id).toSorted()).toEqual([
      "ferry",
      "harbor",
    ]);
  });

  it("keeps the items of a ready take in the order that the lead names them", async () => {
    const harness = await startTakeHarness();
    await harness.call({ name: "open_take", arguments: { step: "pictures" } });
    for (const assetId of ["lantern", "ferry", "harbor"]) {
      await harness.call({
        name: "generate_asset",
        arguments: picture(assetId),
      });
    }

    await harness.call({
      name: "ready_take",
      arguments: {
        items: ["harbor", "ferry", "lantern"].map((id) => ({
          id,
          note: `The picture ${id}.`,
        })),
      },
    });

    const [take] = harness.store.read().takes;
    expect(take?.items.map((item) => item.id)).toEqual([
      "harbor",
      "ferry",
      "lantern",
    ]);
  });

  it("is ready only with a note on each item and what to check on each clip", async () => {
    const harness = await startTakeHarness({ approvePicturesFirst: false });
    await harness.call({ name: "open_take", arguments: { step: "clips" } });
    await harness.call({ name: "generate_asset", arguments: picture("still") });
    await harness.call({
      name: "generate_asset",
      arguments: clip({ assetId: "drift", from: "still" }),
    });

    const missing = await harness.call({
      name: "ready_take",
      arguments: { items: [{ id: "drift", note: "The boat drifts left." }] },
    });

    expect(missing.data).toMatchObject({ kind: "take-not-ready" });
    expect(missing.data["message"]).toBe(
      'No note on "still". No what_to_check on "drift".',
    );
    const ready = await harness.call({
      name: "ready_take",
      arguments: {
        items: [
          {
            id: "drift",
            note: "The boat drifts left.",
            what_to_check: "The rope from 0.2 to 0.6 seconds.",
          },
        ],
        leave_out: ["still"],
      },
    });
    expect(ready.isError).toBe(false);
    expect(harness.store.read().takes[0]).toMatchObject({
      state: "ready",
      items: [
        {
          kind: "asset",
          id: "drift",
          note: "The boat drifts left.",
          whatToCheck: "The rope from 0.2 to 0.6 seconds.",
        },
      ],
    });
  });

  it("keeps one take open: a new round waits until the open take is ready", async () => {
    const harness = await startTakeHarness();
    await harness.call({ name: "open_take", arguments: { step: "pictures" } });
    await harness.call({
      name: "generate_asset",
      arguments: picture("harbor"),
    });

    const second = await harness.call({
      name: "open_take",
      arguments: { step: "clips" },
    });

    expect(second.data).toMatchObject({ kind: "take-already-open" });
  });

  it("get_work names the open take and its state", async () => {
    const harness = await startTakeHarness();
    await readyPictures({ harness, assetIds: ["harbor"] });

    const work = await harness.call({ name: "get_work", arguments: {} });

    expect(work.text).toContain('Chapters: one, "film" (the whole film).');
    expect(work.text).toContain(
      'Open take: take 1 ("take-1", the pictures of chapter "film"), ready, with 1 item. It waits for the person: end your turn.',
    );
    expect(work.text).toContain("The person sent last: no take yet.");
  });
});
