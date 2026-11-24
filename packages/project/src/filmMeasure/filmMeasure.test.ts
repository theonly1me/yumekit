import { describe, expect, it } from "vitest";
import { filmMeasureOf } from "./index.js";

describe("filmMeasureOf", () => {
  it("counts the shots accepted on the first try, the tries, and the money of refused pictures and clips", () => {
    const measure = filmMeasureOf({
      shots: [
        {
          id: "step",
          reviews: [
            { assetId: "clip-1", verdict: "redo", by: "critic" },
            { assetId: "clip-2", verdict: "keep", by: "critic" },
          ],
          startReviews: [{ assetId: "start-0", verdict: "fail" }],
        },
        {
          id: "land",
          reviews: [{ assetId: "clip-3", verdict: "cut", by: "critic" }],
        },
        { id: "rise" },
      ],
      cast: [
        {
          id: "hero",
          referenceAssetIds: ["hero-2"],
          sheetTries: [
            { assetIds: ["hero-1"], verdict: "fail" },
            { assetIds: ["hero-2"], verdict: "pass" },
          ],
        },
        {
          id: "lord",
          referenceAssetIds: ["lord-1"],
          sheetTries: [{ assetIds: ["lord-1"], verdict: "fail" }],
          restrictions: ["Never show his hands"],
        },
      ],
      assets: [
        { id: "hero-1", costUsd: 0.03, firstFrameAssetId: undefined },
        { id: "hero-2", costUsd: 0.13, firstFrameAssetId: undefined },
        { id: "lord-1", costUsd: 0.13, firstFrameAssetId: undefined },
        { id: "start-0", costUsd: 0.13, firstFrameAssetId: undefined },
        { id: "start-1", costUsd: 0.13, firstFrameAssetId: undefined },
        { id: "start-2", costUsd: 0.13, firstFrameAssetId: undefined },
        { id: "clip-1", costUsd: 0.2, firstFrameAssetId: "start-1" },
        { id: "clip-2", costUsd: 0.2, firstFrameAssetId: "start-2" },
        { id: "clip-3", costUsd: 0.2, firstFrameAssetId: undefined },
      ],
    });

    expect(measure.shotCount).toBe(3);
    expect(measure.acceptedFirstCount).toBe(1);
    expect(measure.shots).toEqual([
      { shotId: "step", tries: 3, accepted: true, acceptedFirst: false },
      { shotId: "land", tries: 1, accepted: true, acceptedFirst: true },
      { shotId: "rise", tries: 0, accepted: false, acceptedFirst: false },
    ]);
    expect(measure.sheets).toEqual([
      { castId: "hero", tries: 2, passed: true, restricted: false },
      { castId: "lord", tries: 1, passed: false, restricted: true },
    ]);
    expect(measure.refusedUsd).toBeCloseTo(0.03 + 0.13 + 0.13 + 0.2, 4);
  });
});
