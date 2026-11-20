import { describe, expect, it } from "vitest";
import { defineReactScene, useFrame, VideoFrame } from "../index.js";
import type { SceneAsset } from "../index.js";
import { mountForTest } from "./mountForTest.js";

const clip: SceneAsset = {
  url: "/clip.mp4",
  kind: "video",
  durationFrames: 20,
  framePictures: { urlPrefix: "/test-frame-pictures/", count: 20 },
};

function shiftedScene(shiftFrames: number) {
  return defineReactScene(() => {
    const frame = useFrame();
    return (
      <div style={{ width: 320, height: 180 }}>
        <VideoFrame assetId="clip" assetFrame={frame + shiftFrames} />
      </div>
    );
  });
}

async function shownPictures(options: {
  shiftFrames: number;
  frames: number[];
}): Promise<string[]> {
  const { element, mounted } = await mountForTest({
    scene: shiftedScene(options.shiftFrames),
    durationFrames: 40,
    assets: { clip },
  });
  const shown: string[] = [];
  for (const frame of options.frames) {
    await mounted.seek(frame);
    shown.push(element.querySelector("img")?.getAttribute("src") ?? "");
  }
  return shown;
}

describe("VideoFrame", () => {
  it("shows the picture of the asset frame at urlPrefix, frame, and .jpg", async () => {
    await expect(
      shownPictures({ shiftFrames: 0, frames: [0, 7, 19] }),
    ).resolves.toEqual([
      "/test-frame-pictures/0.jpg",
      "/test-frame-pictures/7.jpg",
      "/test-frame-pictures/19.jpg",
    ]);
  });

  it("shows frame 0 for an asset frame below 0", async () => {
    await expect(
      shownPictures({ shiftFrames: -5, frames: [0, 4, 5] }),
    ).resolves.toEqual([
      "/test-frame-pictures/0.jpg",
      "/test-frame-pictures/0.jpg",
      "/test-frame-pictures/0.jpg",
    ]);
  });

  it("holds the last picture for an asset frame at or past count", async () => {
    await expect(
      shownPictures({ shiftFrames: 0, frames: [20, 39] }),
    ).resolves.toEqual([
      "/test-frame-pictures/19.jpg",
      "/test-frame-pictures/19.jpg",
    ]);
  });

  it("cuts with cover around the center by default, and follows fit and focus", async () => {
    const styled = defineReactScene(() => (
      <>
        <VideoFrame assetId="clip" assetFrame={0} />
        <VideoFrame
          assetId="clip"
          assetFrame={0}
          fit="contain"
          focus={{ x: 0.25, y: 1 }}
        />
      </>
    ));
    const { element, mounted } = await mountForTest({
      scene: styled,
      durationFrames: 1,
      assets: { clip },
    });
    await mounted.seek(0);
    const styles = [...element.querySelectorAll("img")].map((image) => [
      image.style.objectFit,
      image.style.objectPosition,
    ]);
    expect(styles).toEqual([
      ["cover", "50% 50%"],
      ["contain", "25% 100%"],
    ]);
  });
});
