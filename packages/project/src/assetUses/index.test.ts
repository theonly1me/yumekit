import { describe, expect, it } from "vitest";
import { assetUsesOf, type UsesProject } from "./index.js";

const project: UsesProject = {
  scenes: [
    { id: "lake", source: { props: { assetId: "still", heading: "Lake" } } },
    {
      id: "gallery",
      source: { props: { slides: [{ imageAssetId: "still" }] } },
    },
    { id: "named", source: { props: { heading: "still" } } },
    { id: "many", source: { props: { assetIds: ["tune", "still"] } } },
  ],
  timelines: [
    {
      outputId: "wide",
      tracks: [
        { kind: "scene" },
        {
          kind: "audio",
          id: "music",
          clips: [
            { id: "m1", assetId: "tune" },
            { id: "m2", assetId: "voice" },
          ],
        },
      ],
    },
  ],
  cast: [{ id: "fox", referenceAssetIds: ["still"] }],
};

describe("the uses of an asset", () => {
  it("names each scene whose props hold the asset id under an asset key, at any depth", () => {
    expect(assetUsesOf({ project, assetId: "still" })).toEqual([
      { kind: "scene", sceneId: "lake" },
      { kind: "scene", sceneId: "gallery" },
      { kind: "scene", sceneId: "many" },
      { kind: "cast-member", castId: "fox" },
    ]);
  });

  it("names each audio clip with its output and its track", () => {
    expect(assetUsesOf({ project, assetId: "tune" })).toEqual([
      { kind: "scene", sceneId: "many" },
      { kind: "audio-clip", outputId: "wide", trackId: "music", clipId: "m1" },
    ]);
  });

  it("is empty for an asset that nothing uses", () => {
    expect(assetUsesOf({ project, assetId: "spare" })).toEqual([]);
  });
});
