import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import { drawPromptImage } from "./drawPromptImage.ts";

function pixelAt(options: {
  pixels: Uint8Array;
  width: number;
  x: number;
  y: number;
}): number[] {
  const offset = (options.y * options.width + options.x) * 4;
  return [...options.pixels.subarray(offset, offset + 4)];
}

describe("prompt images", () => {
  it("fills the background with the first three bytes of the SHA-256 of the prompt", () => {
    const image = drawPromptImage({
      prompt: "a red fox",
      width: 64,
      height: 32,
      transparentBackground: false,
    });
    const [red, green, blue] = createHash("sha256")
      .update("a red fox")
      .digest();

    expect(pixelAt({ pixels: image.pixels, width: 64, x: 0, y: 0 })).toEqual([
      red,
      green,
      blue,
      255,
    ]);
  });

  it("draws the prompt text in a color other than the background", () => {
    const image = drawPromptImage({
      prompt: "a red fox",
      width: 256,
      height: 32,
      transparentBackground: false,
    });
    const background = pixelAt({
      pixels: image.pixels,
      width: 256,
      x: 0,
      y: 0,
    });
    const colors = new Set<string>();
    for (let offset = 0; offset < image.pixels.length; offset += 4) {
      colors.add(image.pixels.subarray(offset, offset + 4).join(","));
    }

    expect(colors.size).toBe(2);
    expect(colors.has(background.join(","))).toBe(true);
  });

  it("leaves the background transparent when asked", () => {
    const image = drawPromptImage({
      prompt: "a red fox",
      width: 64,
      height: 32,
      transparentBackground: true,
    });

    expect(pixelAt({ pixels: image.pixels, width: 64, x: 0, y: 0 })).toEqual([
      0, 0, 0, 0,
    ]);
  });
});
