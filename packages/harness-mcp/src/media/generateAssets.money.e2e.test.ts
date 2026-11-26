import { describe, expect, it } from "vitest";
import { makeAsset, startPricedHarness } from "../testing/pricedFixture.js";

function imageCall(assetId: string) {
  return {
    asset_id: assetId,
    capability: "image",
    input: { prompt: `a lantern for ${assetId}` },
  };
}

function clipCall(assetId: string) {
  return {
    asset_id: assetId,
    capability: "video",
    input: { prompt: `a river for ${assetId}`, duration_seconds: 4 },
  };
}

describe("a batch that costs more than the money left", () => {
  it("is refused whole with over-money-left, the estimate, and the money left, before the first call", async () => {
    const { harness, paidCallsOfServer } = await startPricedHarness({
      spendingUsd: 3,
    });

    const answer = await harness.call({
      name: "generate_assets",
      arguments: { calls: ["one", "two", "three"].map(clipCall) },
    });

    expect(answer.isError).toBe(true);
    expect(answer.data).toMatchObject({
      kind: "over-money-left",
      estimate_usd: 3.6,
      left_usd: 3,
      limit_usd: 3,
      spent_usd: 0,
      what: "clips",
      paid_calls: 3,
      calls_that_fit: 2,
    });
    expect(answer.text).toContain(
      "The clips of this batch cost about $3.60, and $3.00 is left of the $3.00 of this project. yumekit made no call.",
    );
    expect(await paidCallsOfServer()).toEqual([]);
    expect(harness.store.read().assets).toEqual([]);
  });

  it("counts the money that the project spent before", async () => {
    const { harness, paidCallsOfServer } = await startPricedHarness({
      spendingUsd: 1,
    });
    await makeAsset({ harness, assetId: "first", capability: "image" });

    const answer = await harness.call({
      name: "generate_assets",
      arguments: { calls: ["two", "three"].map(imageCall) },
    });

    expect(answer.data).toMatchObject({
      kind: "over-money-left",
      estimate_usd: 0.8,
      left_usd: 0.6,
      spent_usd: 0.4,
      calls_that_fit: 1,
    });
    expect(await paidCallsOfServer()).toHaveLength(1);
  });

  it("runs a batch whose price fits the money left", async () => {
    const { harness } = await startPricedHarness({ spendingUsd: 1.2 });

    const answer = await harness.call({
      name: "generate_assets",
      arguments: { calls: ["one", "two", "three"].map(imageCall) },
    });

    expect(answer.data).toMatchObject({ worked: 3, failed: 0 });
  });

  it("counts a call for an asset that exists as free, because it makes nothing new", async () => {
    const { harness, paidCallsOfServer } = await startPricedHarness({
      spendingUsd: 1,
    });
    await makeAsset({ harness, assetId: "one", capability: "image" });

    const answer = await harness.call({
      name: "generate_assets",
      arguments: { calls: ["one", "two"].map(imageCall) },
    });

    expect(answer.data).toMatchObject({ worked: 2 });
    expect(await paidCallsOfServer()).toHaveLength(2);
  });

  it("counts a clip of a picture that is not approved as free, so the batch gets picture-not-approved and no warning", async () => {
    const { harness, paidCallsOfServer } = await startPricedHarness({
      spendingUsd: 1,
    });
    await makeAsset({ harness, assetId: "still", capability: "image" });

    const answer = await harness.call({
      name: "generate_assets",
      arguments: {
        calls: ["one", "two", "three"].map((assetId) => ({
          ...clipCall(assetId),
          first_frame_asset_id: "still",
        })),
      },
    });

    expect(answer.data).toMatchObject({ worked: 0, failed: 3 });
    expect(answer.text).toContain("picture-not-approved");
    expect(await paidCallsOfServer()).toHaveLength(1);
  });
});
