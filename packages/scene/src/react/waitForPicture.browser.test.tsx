import { useEffect } from "react";
import { describe, expect, it } from "vitest";
import { defineReactScene, useHold } from "../index.js";
import { mountForTest } from "./mountForTest.js";

const imageSidePixels = 3000;

async function createLargeImageUrl(): Promise<string> {
  const canvas = new OffscreenCanvas(imageSidePixels, imageSidePixels);
  const context = canvas.getContext("2d");
  if (context === null) {
    throw new Error("No 2D canvas context");
  }
  const gradient = context.createLinearGradient(
    0,
    0,
    imageSidePixels,
    imageSidePixels,
  );
  gradient.addColorStop(0, "#ff0055");
  gradient.addColorStop(1, "#0055ff");
  context.fillStyle = gradient;
  context.fillRect(0, 0, imageSidePixels, imageSidePixels);
  const blob = await canvas.convertToBlob({ type: "image/png" });
  return URL.createObjectURL(blob);
}

function waitMilliseconds(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

describe("seek waits for the picture", () => {
  it("does not resolve before an image in the scene decodes", async () => {
    const imageUrl = await createLargeImageUrl();
    const imageScene = defineReactScene(() => <img src={imageUrl} alt="" />);
    const { element, mounted } = await mountForTest({
      scene: imageScene,
      durationFrames: 1,
    });
    await mounted.seek(0);
    const image = element.querySelector("img");
    expect(image?.complete).toBe(true);
    expect(image?.naturalWidth).toBe(imageSidePixels);
  });

  it("rejects when an image in the scene cannot decode", async () => {
    const brokenScene = defineReactScene(() => (
      <img src="data:image/png;base64,AAAA" alt="" />
    ));
    const { mounted } = await mountForTest({
      scene: brokenScene,
      durationFrames: 1,
    });
    await expect(mounted.seek(0)).rejects.toThrow("did not decode");
  });

  it("does not resolve before the scene releases its hold", async () => {
    const releases: (() => void)[] = [];
    const holdingScene = defineReactScene(() => {
      const { release } = useHold();
      useEffect(() => {
        releases.push(release);
      }, [release]);
      return <p>held</p>;
    });
    const { mounted } = await mountForTest({
      scene: holdingScene,
      durationFrames: 1,
    });
    let isSettled = false;
    const seeking = mounted.seek(0).then(() => {
      isSettled = true;
    });
    await waitMilliseconds(100);
    expect(isSettled).toBe(false);
    for (const release of releases) {
      release();
    }
    await seeking;
    expect(isSettled).toBe(true);
  });
});
