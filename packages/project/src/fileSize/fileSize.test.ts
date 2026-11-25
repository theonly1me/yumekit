import { describe, expect, it } from "vitest";
import {
  largestBestMegabytesOf,
  sharpKilobitsOf,
  sizeAtShortSide,
  smallerFilePlanOf,
} from "./index.js";

function planOf(options: { seconds: number; largestMegabytes: number }) {
  return smallerFilePlanOf({
    ...options,
    shortSidePixels: 1080,
    hasAudio: true,
  });
}

describe("the plan of a smaller file", () => {
  it("gives the video the size left after 128 kbps of sound, with 6 percent kept free", () => {
    expect(planOf({ seconds: 30, largestMegabytes: 10 })).toEqual({
      videoKilobits: 2378,
      expectedMegabytes: 9.4,
      look: "sharp",
      offeredShortSide: undefined,
      smallestMegabytes: 1,
    });
  });

  it("offers 720p when 1080p would look soft and 720p looks sharp", () => {
    expect(planOf({ seconds: 120, largestMegabytes: 10 })).toMatchObject({
      videoKilobits: 498,
      look: "soft",
      offeredShortSide: 720,
    });
  });

  it("says that a video is too long for the size when even 480p looks soft", () => {
    expect(planOf({ seconds: 300, largestMegabytes: 10 })).toMatchObject({
      videoKilobits: 122,
      look: "too-long",
      offeredShortSide: undefined,
    });
  });

  it("names the smallest size when the sound alone nearly fills the file", () => {
    expect(planOf({ seconds: 900, largestMegabytes: 10 })).toMatchObject({
      look: "too-small",
      smallestMegabytes: 27.3,
    });
  });

  it("needs more video for each line of picture, measured on AI footage", () => {
    expect([2160, 1080, 720, 480].map(sharpKilobitsOf)).toEqual([
      1980, 700, 381, 207,
    ]);
  });
});

describe("the sizes around a smaller file", () => {
  it("keeps the shape and even sides at a smaller short side", () => {
    expect(
      [
        { widthPixels: 1080, heightPixels: 1920 },
        { widthPixels: 1080, heightPixels: 1350 },
        { widthPixels: 1280, heightPixels: 720 },
      ].map((size) => sizeAtShortSide({ size, shortSidePixels: 720 })),
    ).toEqual([
      { widthPixels: 720, heightPixels: 1280 },
      { widthPixels: 720, heightPixels: 900 },
      { widthPixels: 1280, heightPixels: 720 },
    ]);
  });

  it("gives the largest best file from the rate of AI footage at 1080p", () => {
    expect(
      largestBestMegabytesOf({
        seconds: 30,
        size: { widthPixels: 1920, heightPixels: 1080 },
        framesPerSecond: 30,
      }),
    ).toBe(24.375);
  });
});
