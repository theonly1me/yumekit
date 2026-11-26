import { describe, expect, it } from "vitest";
import { startPricedHarness } from "../testing/pricedFixture.js";

async function readyPictureTake(options: {
  spendingUsd: number;
  nextStepEstimateUsd: number;
}) {
  const { harness } = await startPricedHarness({
    spendingUsd: options.spendingUsd,
  });
  await harness.call({ name: "open_take", arguments: { step: "pictures" } });
  await harness.call({
    name: "generate_asset",
    arguments: {
      asset_id: "harbor",
      capability: "image",
      input: { prompt: "a harbor in fog" },
    },
  });
  return harness.call({
    name: "ready_take",
    arguments: {
      items: [{ id: "harbor", note: "The harbor wall is low." }],
      next_step_estimate_usd: options.nextStepEstimateUsd,
    },
  });
}

describe("ready_take and the money left", { timeout: 60_000 }, () => {
  it("tells the lead when the next step costs more than the money left, so the lead says so before the work", async () => {
    const ready = await readyPictureTake({
      spendingUsd: 1,
      nextStepEstimateUsd: 3,
    });

    expect(ready.data).toMatchObject({
      cost_usd: 0.4,
      next_step_estimate_usd: 3,
      money_left_usd: 0.6,
    });
    expect(ready.text).toContain(
      "The next step costs about $3.00. Only $0.60 of the money of this project is left, so the next step does not fit. Say so in your line, before any work, and offer fewer items",
    );
    expect(ready.text).toContain("is ready, with the price of the next step.");
  });

  it("gives only the price of the next step when the money left covers it", async () => {
    const ready = await readyPictureTake({
      spendingUsd: 5,
      nextStepEstimateUsd: 3,
    });

    expect(ready.data).toMatchObject({ money_left_usd: 4.6 });
    expect(ready.text).toContain("The next step costs about $3.00.");
    expect(ready.text).not.toContain("does not fit");
  });
});
