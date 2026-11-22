import { describe, expect, it } from "vitest";
import { sizeForArea } from "./shapes.ts";

const pageLimits = [
  {
    model: "Seedream 5.5",
    areaPixels: 2_560_000,
    minimum: 921_600,
    maximum: 2_610_000,
  },
  {
    model: "GPT Image 2.6 Flare",
    areaPixels: 1_572_864,
    minimum: 655_360,
    maximum: 8_294_400,
  },
  {
    model: "Ideogram 4.6",
    areaPixels: 2048 * 2048,
    minimum: 256 * 256,
    maximum: 2048 * 2048,
  },
  {
    model: "Qwen Image 3",
    areaPixels: 1024 * 1024,
    minimum: 512 * 512,
    maximum: 2048 * 2048,
  },
  {
    model: "MiniMax H3 Image",
    areaPixels: 2048 * 2048,
    minimum: 655_360,
    maximum: 20_000_000,
  },
  { model: "Krea 3", areaPixels: 1024 * 1024, minimum: 1, maximum: 4_220_160 },
];

const shapes = [
  { widthPixels: 1920, heightPixels: 1080 },
  { widthPixels: 1080, heightPixels: 1920 },
  { widthPixels: 1, heightPixels: 1 },
  { widthPixels: 4000, heightPixels: 500 },
  { widthPixels: 500, heightPixels: 4000 },
];

describe("sizeForArea", () => {
  it.each(pageLimits)(
    "keeps each shape inside the size limits of the $model page",
    (limits) => {
      for (const shape of shapes) {
        const size = sizeForArea({ ...shape, areaPixels: limits.areaPixels });
        const area = size.width * size.height;
        const ratio = size.width / size.height;
        expect(area).toBeGreaterThanOrEqual(limits.minimum);
        expect(area).toBeLessThanOrEqual(limits.maximum);
        expect(ratio).toBeLessThanOrEqual(3);
        expect(ratio).toBeGreaterThanOrEqual(1 / 3);
        expect(Math.max(size.width, size.height)).toBeLessThanOrEqual(3840);
        expect(size.width % 32).toBe(0);
        expect(size.height % 32).toBe(0);
      }
    },
  );

  it("keeps the shape of a 16:9 request", () => {
    expect(
      sizeForArea({
        widthPixels: 1920,
        heightPixels: 1080,
        areaPixels: 1024 * 1024,
      }),
    ).toEqual({ width: 1344, height: 768 });
  });
});
