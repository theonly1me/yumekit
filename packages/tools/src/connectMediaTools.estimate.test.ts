import { describe, expect, it } from "vitest";
import { pricedFixture } from "./testing/pricedFixture.js";

describe("connectMediaTools estimate", () => {
  it("adds the catalog price of each request and gives the money left, and makes no call", async () => {
    const { tools, outputDirectory, callsOfServer } = await pricedFixture({
      spendingUsd: 2,
    });
    await tools.run({
      capability: "image",
      server: "priced",
      input: { prompt: "a lantern" },
      outputDirectory,
      fileStem: "spent",
    });
    const callsBefore = await callsOfServer();

    const estimate = await tools.estimate([
      { capability: "video", server: "priced", input: { duration_seconds: 4 } },
      { capability: "image", server: "priced", input: { resolution: "2K" } },
      { capability: "image", server: "sample", input: { prompt: "free" } },
    ]);

    expect(estimate).toEqual({
      ok: true,
      value: {
        usd: 1.8,
        pricesUsd: [1.2, 0.6, 0],
        limitUsd: 2,
        spentUsd: 0.4,
        leftUsd: 1.6,
      },
    });
    expect(await callsOfServer()).toEqual(callsBefore);
  });

  it("counts a request to a service with no key as free, because it cannot spend", async () => {
    const { tools } = await pricedFixture({ spendingUsd: 2, key: "" });

    const estimate = await tools.estimate([
      { capability: "image", server: "priced", input: { prompt: "a fox" } },
    ]);

    expect(estimate).toMatchObject({ ok: true, value: { usd: 0 } });
  });
});
