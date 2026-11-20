import { describe, expect, it } from "vitest";
import { mountKitScene } from "../testing/mountKitScene.js";
import { testImageAsset } from "../testing/sampleProps.js";

describe("image-pan", () => {
  it("draws a placeholder and no image when the asset is missing", async () => {
    const { element, mounted } = await mountKitScene({
      name: "image-pan",
      durationFrames: 30,
      props: { assetId: "missing", caption: "Still here" },
    });
    await mounted.seek(29);
    expect(element.querySelector("img")).toBeNull();
    expect(element.textContent).toBe("Still here");
  });

  it("moves the image between the first and the last frame", async () => {
    const { element, mounted } = await mountKitScene({
      name: "image-pan",
      durationFrames: 30,
      props: { assetId: "photo", direction: "left" },
      assets: { photo: await testImageAsset() },
    });
    const transforms: string[] = [];
    for (const frame of [0, 29]) {
      await mounted.seek(frame);
      transforms.push(element.querySelector("img")?.style.transform ?? "");
    }
    expect(transforms).toEqual([
      "translate(-5%, 0%) scale(1.12)",
      "translate(5%, 0%) scale(1.12)",
    ]);
  });
});
