import { describe, expect, it } from "vitest";
import type { MediaModel } from "../tools/mediaServers.js";
import { lowestPriceText, priceOf, priceText } from "./price.js";

function modelWith(prices: MediaModel["prices"]): MediaModel {
  return {
    id: "model",
    label: "Model",
    capability: "video",
    is_default: true,
    settings: [],
    prices,
    read_on: "2026-11-21",
  };
}

const falPrices = modelWith([
  { usd: 0.2205, unit: "second", when: { resolution: "480p" } },
  { usd: 0.473, unit: "second", when: { resolution: "720p" } },
]);

describe("the price of a clip", () => {
  it("multiplies the price of the selected resolution by the seconds", () => {
    const price = priceOf({
      model: falPrices,
      values: { duration_seconds: 5, resolution: "720p" },
    });

    expect(priceText(price)).toBe("About $2.37");
  });

  it("uses the price whose settings match the most selected values", () => {
    const model = modelWith([
      { usd: 1, unit: "second", when: {} },
      {
        usd: 2,
        unit: "second",
        when: { resolution: "1080p", with_audio: "true" },
      },
    ]);

    const withSound = priceOf({
      model,
      values: { duration_seconds: 3, resolution: "1080p", with_audio: true },
    });
    const withoutSound = priceOf({
      model,
      values: { duration_seconds: 3, resolution: "1080p", with_audio: false },
    });

    expect(priceText(withSound)).toBe("About $6.00");
    expect(priceText(withoutSound)).toBe("About $3.00");
  });

  it("says the price is not known when no price matches the selected values", () => {
    const price = priceOf({
      model: falPrices,
      values: { duration_seconds: 5, resolution: "4k" },
    });

    expect(priceText(price)).toBe("Price not known");
  });

  it("says free for a model whose matching price is 0", () => {
    const model = modelWith([{ usd: 0, unit: "second", when: {} }]);

    expect(priceText(priceOf({ model, values: { duration_seconds: 9 } }))).toBe(
      "Free",
    );
    expect(lowestPriceText(model)).toBe("Free");
  });

  it("names the lowest price and its unit in the model list", () => {
    expect(lowestPriceText(falPrices)).toBe("From $0.22 a second");
    expect(lowestPriceText(modelWith([]))).toBe("Price not known");
  });
});
