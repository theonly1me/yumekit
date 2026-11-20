import type { JsonObject, SceneAsset } from "@yumekit/scene";
import { describe, expect, it } from "vitest";
import { mountKitScene, tallOutput } from "../testing/mountKitScene.js";
import { testImageAsset } from "../testing/sampleProps.js";

const clip: SceneAsset = {
  url: "/clip.mp4",
  kind: "video",
  widthPixels: 1280,
  heightPixels: 720,
  durationFrames: 60,
  framePictures: { urlPrefix: "/test-frame-pictures/", count: 60 },
};

async function shownPictures(options: {
  props: JsonObject;
  durationFrames: number;
  frames: number[];
}): Promise<string[]> {
  const { element, mounted } = await mountKitScene({
    name: "video-clip",
    durationFrames: options.durationFrames,
    props: options.props,
    assets: { clip },
  });
  const shown: string[] = [];
  for (const frame of options.frames) {
    await mounted.seek(frame);
    shown.push(element.querySelector("img")?.getAttribute("src") ?? "");
  }
  return shown;
}

describe("video-clip", () => {
  it("shows asset frame f at scene frame f", async () => {
    await expect(
      shownPictures({
        props: { assetId: "clip" },
        durationFrames: 60,
        frames: [0, 15, 59],
      }),
    ).resolves.toEqual([
      "/test-frame-pictures/0.jpg",
      "/test-frame-pictures/15.jpg",
      "/test-frame-pictures/59.jpg",
    ]);
  });

  it("holds the last picture when the clip is longer than the asset", async () => {
    await expect(
      shownPictures({
        props: { assetId: "clip" },
        durationFrames: 90,
        frames: [59, 60, 89],
      }),
    ).resolves.toEqual([
      "/test-frame-pictures/59.jpg",
      "/test-frame-pictures/59.jpg",
      "/test-frame-pictures/59.jpg",
    ]);
  });

  it("moves the first picture by startSeconds times the frame rate", async () => {
    await expect(
      shownPictures({
        props: { assetId: "clip", startSeconds: 0.5 },
        durationFrames: 30,
        frames: [0, 10],
      }),
    ).resolves.toEqual([
      "/test-frame-pictures/15.jpg",
      "/test-frame-pictures/25.jpg",
    ]);
  });

  it("passes fit and focus to the picture", async () => {
    const { element, mounted } = await mountKitScene({
      name: "video-clip",
      durationFrames: 1,
      props: { assetId: "clip", fit: "contain", focus: { x: 0.8, y: 0.2 } },
      output: tallOutput,
      assets: { clip },
    });
    await mounted.seek(0);
    const image = element.querySelector("img");
    expect([image?.style.objectFit, image?.style.objectPosition]).toEqual([
      "contain",
      "80% 20%",
    ]);
  });

  it("puts the caption at the top, out of the caption area of the narration", async () => {
    const { element, mounted } = await mountKitScene({
      name: "video-clip",
      durationFrames: 30,
      props: { assetId: "clip", caption: "A clip with a caption" },
      output: tallOutput,
      assets: { clip },
    });
    await mounted.seek(29);
    const frame = element.getBoundingClientRect();
    const panel = element.querySelector("p")?.getBoundingClientRect();
    expect(panel?.bottom).toBeLessThan(frame.top + frame.height / 2);
  });

  it("draws a placeholder and the caption when the asset is missing or is not a video", async () => {
    for (const assetId of ["missing", "photo"]) {
      const { element, mounted } = await mountKitScene({
        name: "video-clip",
        durationFrames: 30,
        props: { assetId, caption: "Still here" },
        assets: { photo: await testImageAsset() },
      });
      await mounted.seek(29);
      expect(element.querySelector("img")).toBeNull();
      expect(element.textContent).toBe("Still here");
    }
  });
});
