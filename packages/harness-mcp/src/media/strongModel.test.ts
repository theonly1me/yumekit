import { describe, expect, it } from "vitest";
import { putEntry, sheetTry } from "../testing/firstCutFixture.js";
import { startPricedHarness } from "../testing/pricedFixture.js";
import { passPlan, setPlan } from "../testing/storyFixture.js";

describe("the model of a sheet picture", () => {
  it("uses the strongest picture model of the service for a sheet, says the price difference, and keeps the default for other pictures", async () => {
    const { harness } = await startPricedHarness({});
    await putEntry({ harness, castId: "forge" });
    await putEntry({ harness, castId: "smith" });
    await setPlan({ harness, shots: [{ shot_id: "strike" }] });
    await passPlan(harness);

    const sheet = await sheetTry({
      harness,
      castId: "smith",
      assetId: "smith-1",
    });
    const sheetModel = harness.store
      .read()
      .assets.find((asset) => asset.id === "smith-1")?.source;
    const plain = await harness.call({
      name: "generate_asset",
      arguments: {
        asset_id: "poster",
        capability: "image",
        input: { prompt: "A poster" },
      },
    });
    const plainModel = harness.store
      .read()
      .assets.find((asset) => asset.id === "poster")?.source;

    expect(sheet.isError).toBe(false);
    expect(sheetModel).toMatchObject({ model: "priced-image-pro" });
    expect(sheet.text).toContain(
      "Made with priced-image-pro, the strongest picture model of priced, at 1.2 US dollars a picture; the default priced-image costs 0.4, because every later picture copies a sheet.",
    );
    expect(plain.isError).toBe(false);
    expect(plainModel).not.toMatchObject({ model: "priced-image-pro" });
  });
});
