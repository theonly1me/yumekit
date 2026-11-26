import { describe, expect, it } from "vitest";
import { pricedFixture } from "./testing/pricedFixture.js";
import type { MediaTools } from "./types.js";

async function modelsOf(options: { tools: MediaTools; capability: string }) {
  const choices = await options.tools.choices();
  const choice = choices.choices.find(
    (each) => each.capability === options.capability,
  );
  return choice?.services.find((service) => service.server === "priced")
    ?.models;
}

describe("the price of each model in the picker", () => {
  it("gives the price at the default value of each setting, with the default resolution, so a person can compare models", async () => {
    const { tools } = await pricedFixture({});

    expect(await modelsOf({ tools, capability: "image" })).toEqual([
      {
        id: "priced-image",
        label: "priced-image",
        isDefault: true,
        priceAtDefaults: { usd: 0.4, unit: "image" },
        defaultResolution: "1K",
      },
      {
        id: "priced-image-pro",
        label: "priced-image-pro",
        isDefault: false,
        priceAtDefaults: { usd: 1.2, unit: "image" },
        defaultResolution: "1K",
      },
    ]);
  });

  it("gives a price for each second of a video model, and no price for a model with none", async () => {
    const { tools } = await pricedFixture({});

    expect(await modelsOf({ tools, capability: "video" })).toEqual([
      expect.objectContaining({
        id: "priced-video",
        priceAtDefaults: { usd: 0.3, unit: "second" },
      }),
    ]);
    expect(await modelsOf({ tools, capability: "music" })).toEqual([
      {
        id: "unpriced-music",
        label: "unpriced-music",
        isDefault: true,
      },
    ]);
  });

  it("passes on whether a model ran with yumekit, as its server describes it", async () => {
    const { tools } = await pricedFixture({});
    const choices = await tools.choices();
    const video = choices.choices.find((each) => each.capability === "video");
    const sample = video?.services.find(
      (service) => service.server === "sample",
    );

    expect(sample?.models).toEqual([
      expect.objectContaining({ id: "sample-video", tested: true }),
    ]);
  });
});
