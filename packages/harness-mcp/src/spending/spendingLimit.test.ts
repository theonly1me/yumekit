import { describe, expect, it } from "vitest";
import { makeAsset, startPricedHarness } from "../testing/pricedFixture.js";

describe("the spending limit of a project", () => {
  it("runs paid calls under the limit and refuses the call that would pass it before it reaches the media server", async () => {
    const { harness, paidCallsOfServer } = await startPricedHarness({
      spendingUsd: 1,
    });

    const first = await makeAsset({
      harness,
      assetId: "one",
      capability: "image",
    });
    await makeAsset({ harness, assetId: "two", capability: "image" });
    const refused = await makeAsset({
      harness,
      assetId: "three",
      capability: "image",
    });

    expect(first.data).toMatchObject({ cost_usd: 0.4, cost_is_estimate: true });
    expect(refused.isError).toBe(true);
    expect(refused.data).toMatchObject({
      kind: "spending-limit-reached",
      limit_usd: 1,
      spent_usd: 0.8,
      price_usd: 0.4,
      price_is_cautious: false,
    });
    expect(refused.data["message"]).toBe(
      "This call costs about 0.40 US dollars. The project has spent 0.80 US dollars of its limit of 1.00 US dollars, so the call would pass the limit. yumekit did not make it.",
    );
    expect(refused.data["hint"]).toContain("only they can raise");
    expect(await paidCallsOfServer()).toEqual([
      "generate_image",
      "generate_image",
    ]);
    expect(harness.store.read().assets.map((asset) => asset.id)).toEqual([
      "one",
      "two",
    ]);
  });

  it("keeps each paid call after the asset is removed and its id is made again", async () => {
    const { harness } = await startPricedHarness({});
    await makeAsset({
      harness,
      assetId: "song",
      capability: "music",
      input: { duration_seconds: 4 },
    });
    await harness.call({
      name: "remove_asset",
      arguments: { asset_id: "song" },
    });
    await makeAsset({
      harness,
      assetId: "song",
      capability: "music",
      input: { duration_seconds: 4, prompt: "a calmer song" },
    });

    const listed = await harness.call({ name: "list_media_tools" });
    const work = await harness.call({ name: "get_work" });

    expect(listed.data["spending"]).toEqual({
      limit_usd: 5,
      spent_usd: 1,
      remaining_usd: 4,
      paid_calls: 2,
    });
    expect(listed.text).toContain(
      "Spending: about 1.00 of 5.00 US dollars used, 4.00 left.",
    );
    expect(work.text).toContain(
      "Spending: about 1.00 of 5.00 US dollars used, 4.00 left.",
    );
  });

  it("counts a model with no known price at the cautious price and says so", async () => {
    const { harness } = await startPricedHarness({});

    const made = await makeAsset({
      harness,
      assetId: "song",
      capability: "music",
      input: { duration_seconds: 4 },
    });

    expect(made.data).toMatchObject({ cost_usd: 0.5, price_not_known: true });
    expect(made.text).toContain(
      "The model has no known price, so yumekit counted a cautious 0.50 US dollars.",
    );
  });
});
