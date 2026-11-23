import { describe, expect, it } from "vitest";
import { isStartFormatId, startFormatCatalog } from "../index.js";

function wordCountOf(text: string): number {
  return text.split(/\s+/).filter((word) => word !== "").length;
}

describe("the start format catalog", () => {
  it("has the eight formats of document 16 in their order, with No format first", () => {
    expect(
      startFormatCatalog.map((format) => [format.id, format.name]),
    ).toEqual([
      ["free", "No format"],
      ["explainer", "Explainer"],
      ["product-ad", "Product ad"],
      ["story", "Story"],
      ["talking-head", "Talking head"],
      ["list", "5 tips"],
      ["quote", "Quote"],
      ["news", "News"],
    ]);
  });

  it("gives each format but No format a direction under 120 words, with ordered beats that share the whole length", () => {
    const formats = startFormatCatalog.filter((format) => format.id !== "free");

    for (const format of formats) {
      const shares = [...format.direction.matchAll(/(\d+) percent/g)].map(
        (match) => Number(match[1]),
      );
      expect(wordCountOf(format.direction), format.id).toBeLessThan(120);
      expect(format.direction, format.id).toMatch(/^Structure, in this order/);
      expect(format.direction, format.id).toContain("Pace:");
      expect(format.direction, format.id).toContain("Avoid:");
      expect(
        shares.reduce((...[sum, share]) => sum + share, 0),
        format.id,
      ).toBe(100);
    }
  });

  it("gives No format no direction, so the request of the person leads", () => {
    expect(startFormatCatalog[0]?.direction).toBe("");
  });

  it("knows each id of the catalog and no other", () => {
    expect(isStartFormatId("product-ad")).toBe(true);
    expect(isStartFormatId("tutorial")).toBe(false);
  });
});
