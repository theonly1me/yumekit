import { describe, expect, it } from "vitest";
import { startTakeHarness, type TakeHarness } from "../testing/takeHarness.js";

async function readyMusic(options: {
  harness: TakeHarness;
  assetId: string;
}): Promise<void> {
  const { harness, assetId } = options;
  await harness.call({ name: "open_take", arguments: { step: "clips" } });
  await harness.call({
    name: "generate_asset",
    arguments: {
      asset_id: assetId,
      capability: "music",
      input: { prompt: "low strings", duration_seconds: 2 },
    },
  });
  await harness.call({
    name: "ready_take",
    arguments: {
      items: [
        {
          id: assetId,
          note: "Low strings.",
          what_to_check: "The swell at 1 second.",
        },
      ],
    },
  });
}

describe("a Use this pick of the person", { timeout: 60_000 }, () => {
  it("tells the lead to use the pick for its place, in place of the version used before, and get_work keeps it until it is placed", async () => {
    const harness = await startTakeHarness();
    await readyMusic({ harness, assetId: "theme" });
    const first = await harness.sendTake({
      takeId: "take-1",
      notes: [{ item_id: "theme", text: "", approved: true, use: true }],
    });
    await readyMusic({ harness, assetId: "theme-2" });

    const second = await harness.sendTake({
      takeId: "take-2",
      notes: [
        { item_id: "theme-2", text: "Warmer.", approved: true, use: true },
      ],
    });
    const work = await harness.call({ name: "get_work", arguments: {} });

    expect(first.ok && first.value.details).toContain(
      'Use the music "theme" as the music.',
    );
    expect(second.ok && second.value.text).toBe(
      "Take 2 of the clips: all good. Go on.",
    );
    expect(second.ok && second.value.details).toContain(
      'Use the music "theme-2" as the music, in place of "theme".',
    );
    expect(second.ok && second.value.details).toContain(
      "remake nothing for its place, and never undo a pick",
    );
    expect(work.text).toContain(
      'Picks of the person that wait for you: put each into the film as it is, and remake nothing for its place.\n- Use the music "theme-2" as the music.',
    );
  });
});
