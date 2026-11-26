import { describe, expect, it } from "vitest";
import {
  picture,
  readyPictures,
  startTakeHarness,
} from "../testing/takeHarness.js";

describe("the person sends a take", { timeout: 60_000 }, () => {
  it("gives the lead each note with its pin or moment, and the approved items", async () => {
    const harness = await startTakeHarness();
    await harness.call({ name: "open_take", arguments: { step: "pictures" } });
    await harness.call({
      name: "generate_assets",
      arguments: {
        calls: [picture("harbor"), picture("ferry"), picture("lamp")],
      },
    });
    await harness.call({
      name: "generate_asset",
      arguments: {
        asset_id: "theme",
        capability: "music",
        input: { prompt: "low strings", duration_seconds: 2 },
      },
    });
    await harness.call({
      name: "ready_take",
      arguments: {
        items: ["harbor", "ferry", "lamp", "theme"].map((id) => ({
          id,
          note: `The lead's note on ${id}.`,
          ...(id === "theme"
            ? { what_to_check: "The swell at 1 second." }
            : {}),
        })),
      },
    });

    const sent = await harness.sendTake({
      takeId: "take-1",
      notes: [
        {
          item_id: "harbor",
          text: "Make the wall taller.",
          pin: { x: 0.25, y: 0.5 },
        },
        { item_id: "theme", text: "The drum is too loud here.", seconds: 1.5 },
        { item_id: "lamp", text: "", dropped: true },
      ],
    });

    expect(sent.ok && sent.value.text).toBe(
      "Take 1 of the pictures: 3 notes for the lead.",
    );
    expect(sent.ok && sent.value.details.split("\n")).toEqual([
      'The person sent take 1 ("take-1", the pictures of chapter "film") with 3 notes:',
      '1. The picture "harbor": "Make the wall taller." Pin at 25% from the left and 50% from the top.',
      '2. The sound "theme": "The drum is too loud here." At 1.5 seconds.',
      '3. The picture "lamp": Don\'t use this one.',
      'Approved, so keep them as they are: "ferry".',
      "Make each item with a note again in a new take of the pictures: open_take, then ready_take with replaces_asset_id. Leave out each item that the person dropped. If a note is not clear, ask the person.",
    ]);
  });

  it("approves each item when no item has a note, and tells the lead to go on", async () => {
    const harness = await startTakeHarness();
    await readyPictures({ harness, assetIds: ["harbor", "ferry"] });

    const sent = await harness.sendTake({ takeId: "take-1", notes: [] });

    const [take] = harness.store.read().takes;
    expect(take?.items.map((item) => [item.id, item.approved])).toEqual(
      expect.arrayContaining([
        ["harbor", true],
        ["ferry", true],
      ]),
    );
    expect(sent.ok && sent.value.text).toBe(
      "Take 1 of the pictures: all good. Go on.",
    );
    expect(sent.ok && sent.value.details).toContain(
      'Go on to the next step now: open a take of clips for chapter "film"',
    );
  });

  it("refuses a take that is not ready, and get_work names what the person sent last", async () => {
    const harness = await startTakeHarness();
    await harness.call({ name: "open_take", arguments: { step: "pictures" } });
    await harness.call({
      name: "generate_asset",
      arguments: picture("harbor"),
    });

    const early = await harness.sendTake({ takeId: "take-1", notes: [] });
    await harness.call({
      name: "ready_take",
      arguments: { items: [{ id: "harbor", note: "The harbor at dawn." }] },
    });
    await harness.sendTake({
      takeId: "take-1",
      notes: [{ item_id: "harbor", text: "More fog." }],
    });
    const work = await harness.call({ name: "get_work", arguments: {} });

    expect(early.ok || early.failure.kind).toBe("take-not-ready");
    expect(work.text).toMatch(
      /The person sent last: take 1 \("take-1", the pictures of chapter "film"\) at \S+, with 1 note\.\n1\. The picture "harbor": "More fog\."\nApproved: none\./,
    );
    expect(work.text).toContain("Open take: none.");
  });
});
