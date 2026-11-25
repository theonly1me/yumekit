import { describe, expect, it } from "vitest";
import { z } from "zod";
import { startPricedHarness } from "../testing/pricedFixture.js";

const waitMilliseconds = 1500;

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
    input: { prompt: `a river for ${assetId}`, duration_seconds: 2 },
  };
}

async function timed<Value>(work: () => Promise<Value>) {
  const started = performance.now();
  const value = await work();
  return { value, milliseconds: performance.now() - started };
}

const partsSchema = z.array(
  z.object({ ok: z.boolean(), kind: z.string().optional() }),
);

function kindsOf(data: Record<string, unknown>): string[] {
  return partsSchema
    .parse(data["results"])
    .map((part) => (part.ok ? "made" : (part.kind ?? "failed")));
}

describe("several media calls at the same time", () => {
  it("makes three pictures in one call in about the time of one picture", async () => {
    const { harness, mostCallsAtOnce } = await startPricedHarness({
      waitMilliseconds,
    });

    const { value, milliseconds } = await timed(() =>
      harness.call({
        name: "generate_assets",
        arguments: { calls: ["one", "two", "three"].map(imageCall) },
      }),
    );

    expect(value.data).toMatchObject({ worked: 3, failed: 0 });
    expect(harness.store.read().assets.map((asset) => asset.id)).toEqual(
      expect.arrayContaining(["one", "two", "three"]),
    );
    expect(await mostCallsAtOnce()).toBe(3);
    expect(milliseconds).toBeLessThan(waitMilliseconds * 3);
  });

  it("runs at most the calls at once that the setting permits on one service", async () => {
    const { harness, mostCallsAtOnce } = await startPricedHarness({
      waitMilliseconds,
      limits: { callsAtOnce: 1 },
    });

    const { value, milliseconds } = await timed(() =>
      harness.call({
        name: "generate_assets",
        arguments: { calls: ["one", "two", "three"].map(imageCall) },
      }),
    );

    expect(value.data).toMatchObject({ worked: 3 });
    expect(await mostCallsAtOnce()).toBe(1);
    expect(milliseconds).toBeGreaterThanOrEqual(waitMilliseconds * 3);
  });

  it("runs at most three calls at once on a paid service by default", async () => {
    const { harness, mostCallsAtOnce } = await startPricedHarness({
      waitMilliseconds,
    });

    const answer = await harness.call({
      name: "generate_assets",
      arguments: { calls: ["a", "b", "c", "d"].map(imageCall) },
    });

    expect(answer.data).toMatchObject({ worked: 4 });
    expect(await mostCallsAtOnce()).toBe(3);
  });

  it("holds the video seconds of running clips, so parallel clips cannot pass the limit together", async () => {
    const { harness, paidCallsOfServer } = await startPricedHarness({
      waitMilliseconds,
      limits: { generatedVideoSeconds: 5 },
    });

    const answer = await harness.call({
      name: "generate_assets",
      arguments: { calls: ["one", "two", "three"].map(clipCall) },
    });

    expect(
      kindsOf(answer.data).filter(
        (kind) => kind === "generated-video-limit-reached",
      ),
    ).toHaveLength(1);
    expect(await paidCallsOfServer()).toHaveLength(2);
  });

  it("holds the price of running calls, so calls at the same time cannot pass the spending limit together", async () => {
    const { harness, paidCallsOfServer } = await startPricedHarness({
      waitMilliseconds,
      spendingUsd: 1,
    });

    const answers = await Promise.all(
      ["one", "two", "three"].map((id) =>
        harness.call({ name: "generate_asset", arguments: imageCall(id) }),
      ),
    );

    expect(
      answers
        .map((answer) =>
          answer.isError ? String(answer.data["kind"]) : "made",
        )
        .toSorted(),
    ).toEqual(["made", "made", "spending-limit-reached"]);
    expect(await paidCallsOfServer()).toHaveLength(2);
  });

  it("refuses a second call for the same asset id while the first one runs", async () => {
    const { harness, paidCallsOfServer } = await startPricedHarness({
      waitMilliseconds,
    });

    const answer = await harness.call({
      name: "generate_assets",
      arguments: {
        calls: [imageCall("one"), { ...imageCall("one") }],
      },
    });

    expect(kindsOf(answer.data)).toEqual(["made", "id-in-use"]);
    expect(await paidCallsOfServer()).toHaveLength(1);
  });

  it("sends no more calls of the group to a service after its quota is used up", async () => {
    const { harness, paidCallsOfServer } = await startPricedHarness({
      waitMilliseconds: 200,
      limits: { callsAtOnce: 1 },
      quotaUsedUp: true,
    });

    const answer = await harness.call({
      name: "generate_assets",
      arguments: { calls: ["one", "two", "three"].map(imageCall) },
    });

    expect(kindsOf(answer.data)).toEqual([
      "service-quota",
      "service-quota",
      "service-quota",
    ]);
    expect(answer.text).toContain("did not send this call");
    expect(await paidCallsOfServer()).toHaveLength(1);
  });
});
