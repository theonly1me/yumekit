import { saveKey } from "@yumekit/tools";
import { describe, expect, it } from "vitest";
import { keyedServerCommand, startHarness } from "../testing/harnessFixture.js";

const saveTestKey = () =>
  saveKey({ variable: "YUMEKIT_TEST_KEY", value: "made-up-value-4" });

describe("generate_asset models", () => {
  it("passes model to the tool and keeps the model and cost_is_estimate in the source record", async () => {
    const harness = await startHarness({
      mediaToolsFile: { mcpServers: { keyed: keyedServerCommand } },
      beforeConnect: saveTestKey,
    });

    const result = await harness.call({
      name: "generate_asset",
      arguments: {
        asset_id: "fox",
        capability: "image",
        model: "keyed-image-large",
        input: { prompt: "a fox" },
      },
    });
    const listed = await harness.call({ name: "list_assets" });

    expect(result.isError).toBe(false);
    expect(harness.runRequests.at(-1)?.model).toBe("keyed-image-large");
    expect(harness.store.read().assets[0]?.source).toEqual({
      kind: "tool",
      server: "keyed",
      tool: "generate_image",
      model: "keyed-image-large",
      input: { prompt: "a fox" },
      costUsd: 0.5,
      costIsEstimate: true,
    });
    expect(listed.data["assets"]).toMatchObject([
      {
        source: {
          model: "keyed-image-large",
          cost_usd: 0.5,
          cost_is_estimate: true,
        },
      },
    ]);
  });

  it("records the default model of defaults when the call gives no model", async () => {
    const harness = await startHarness({
      mediaToolsFile: {
        mcpServers: { sample: {}, keyed: keyedServerCommand },
        defaults: { image: { server: "keyed", model: "keyed-image-large" } },
      },
      beforeConnect: saveTestKey,
    });

    await harness.call({
      name: "generate_asset",
      arguments: {
        asset_id: "fox",
        capability: "image",
        input: { prompt: "a fox" },
      },
    });

    expect(harness.store.read().assets[0]?.source).toMatchObject({
      server: "keyed",
      model: "keyed-image-large",
    });
  });

  it("returns the server message with the model ids for an unknown model", async () => {
    const harness = await startHarness();

    const result = await harness.call({
      name: "generate_asset",
      arguments: {
        asset_id: "fox",
        capability: "image",
        model: "no-such-model",
        input: { prompt: "a fox" },
      },
    });

    expect(result.isError).toBe(true);
    expect(result.data["message"]).toContain(
      'Unknown model "no-such-model". The image models of this server are: sample-image.',
    );
  });

  it("makes a new asset for the same input with another model", async () => {
    const harness = await startHarness({
      mediaToolsFile: { mcpServers: { keyed: keyedServerCommand } },
      beforeConnect: saveTestKey,
    });
    const image = (request: { assetId: string; model: string }) =>
      harness.call({
        name: "generate_asset",
        arguments: {
          asset_id: request.assetId,
          capability: "image",
          model: request.model,
          input: { prompt: "a fox" },
        },
      });

    await image({ assetId: "fox", model: "keyed-image" });
    const other = await image({
      assetId: "fox-large",
      model: "keyed-image-large",
    });

    expect(other.data["reused"]).toBe(false);
  });
});
