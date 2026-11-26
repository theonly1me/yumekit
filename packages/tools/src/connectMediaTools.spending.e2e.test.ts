import { describe, expect, it } from "vitest";
import { pricedFixture } from "./testing/pricedFixture.js";
import type { Capability, JsonObject, MediaTools } from "./types.js";

function make(options: {
  tools: MediaTools;
  capability: Capability;
  outputDirectory: string;
  fileStem: string;
  input?: JsonObject;
  server?: string;
}) {
  return options.tools.run({
    capability: options.capability,
    server: options.server ?? "priced",
    input: { prompt: "a lantern", ...options.input },
    outputDirectory: options.outputDirectory,
    fileStem: options.fileStem,
  });
}

describe("connectMediaTools spending limit", () => {
  it("runs a call under the limit and records its catalog price as an estimate", async () => {
    const { tools, outputDirectory, ledger } = await pricedFixture({
      spendingUsd: 1,
    });

    const made = await make({
      tools,
      capability: "image",
      outputDirectory,
      fileStem: "first",
    });

    expect(made.ok && made.value.cost).toEqual({ usd: 0.4, basis: "catalog" });
    expect(await ledger()).toMatchObject([
      { server: "priced", model: "priced-image", usd: 0.4, basis: "catalog" },
    ]);
    expect(await tools.spending()).toEqual({
      ok: true,
      value: { limitUsd: 1, spentUsd: 0.4, remainingUsd: 0.6, paidCalls: 1 },
    });
  });

  it("refuses the call that would pass the limit before it reaches the server", async () => {
    const fixture = await pricedFixture({ spendingUsd: 1 });
    const { tools, outputDirectory } = fixture;
    await make({ tools, capability: "image", outputDirectory, fileStem: "a" });
    await make({ tools, capability: "image", outputDirectory, fileStem: "b" });

    const refused = await make({
      tools,
      capability: "image",
      outputDirectory,
      fileStem: "c",
    });

    expect(refused.ok ? "ran" : refused.failure).toEqual({
      kind: "spending-limit-reached",
      server: "priced",
      limitUsd: 1,
      spentUsd: 0.8,
      priceUsd: 0.4,
      priceBasis: "catalog",
    });
    expect(await fixture.callsOfServer()).toEqual([
      "generate_image",
      "generate_image",
    ]);
  });

  it("counts a model with no known price at the cautious price of its kind", async () => {
    const { tools, outputDirectory, ledger } = await pricedFixture({
      spendingUsd: 0.6,
    });

    const first = await make({
      tools,
      capability: "music",
      outputDirectory,
      fileStem: "song",
      input: { duration_seconds: 30 },
    });
    const second = await make({
      tools,
      capability: "music",
      outputDirectory,
      fileStem: "song",
      input: { duration_seconds: 30 },
    });

    expect(first.ok && first.value.cost).toEqual({
      usd: 0.5,
      basis: "cautious",
    });
    expect(second.ok ? "ran" : second.failure.kind).toBe(
      "spending-limit-reached",
    );
    expect(await ledger()).toHaveLength(1);
  });

  it("prices a video by its seconds and keeps each paid call when a file stem repeats", async () => {
    const { tools, outputDirectory, ledger } = await pricedFixture({});

    for (const seconds of [4, 6]) {
      await make({
        tools,
        capability: "video",
        outputDirectory,
        fileStem: "clip",
        input: { duration_seconds: seconds },
      });
    }

    expect((await ledger()).map((entry) => entry.usd)).toEqual([1.2, 1.8]);
    expect(await tools.spending()).toMatchObject({
      value: { limitUsd: 5, spentUsd: 3, remainingUsd: 2 },
    });
  });

  it("never refuses a free server, also with a limit of 0", async () => {
    const { tools, outputDirectory, ledger } = await pricedFixture({
      spendingUsd: 0,
    });

    const made = await make({
      tools,
      capability: "image",
      server: "sample",
      outputDirectory,
      fileStem: "free",
    });

    expect(made.ok && made.value.cost).toBeUndefined();
    expect(await ledger()).toEqual([]);
  });
});
