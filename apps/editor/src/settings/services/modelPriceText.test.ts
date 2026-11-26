import { describe, expect, it } from "vitest";
import { modelPriceText } from "./modelPriceText.js";

describe("the price line of a model in the picker", () => {
  it.each([
    {
      name: "a video model by the second at its default size, with the third digit of its page",
      price: { usd: 0.473, unit: "second" as const },
      resolution: "720p",
      text: "About $0.473 a second at 720p",
    },
    {
      name: "a price that floating point stores just below its value, as the page writes it",
      price: { usd: 0.235, unit: "second" as const },
      resolution: "1080p",
      text: "About $0.235 a second at 1080p",
    },
    {
      name: "a price with more than three digits, rounded to three",
      price: { usd: 0.0819, unit: "second" as const },
      resolution: "720p",
      text: "About $0.082 a second at 720p",
    },
    {
      name: "a price in whole cents with two digits",
      price: { usd: 0.08, unit: "second" as const },
      resolution: "1080p",
      text: "About $0.08 a second at 1080p",
    },
    {
      name: "a picture model with no size setting",
      price: { usd: 0.03, unit: "image" as const },
      resolution: null,
      text: "About $0.03 a picture",
    },
    {
      name: "a song",
      price: { usd: 0.08, unit: "call" as const },
      resolution: null,
      text: "About $0.08 each time",
    },
    {
      name: "a free model",
      price: { usd: 0, unit: "second" as const },
      resolution: "720p",
      text: "Free",
    },
    {
      name: "a model with no price in its catalog",
      price: null,
      resolution: "720p",
      text: "Price not known",
    },
  ])("says $name", ({ price, resolution, text }) => {
    expect(modelPriceText({ price, resolution })).toBe(text);
  });
});
