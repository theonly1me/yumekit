import { describe, expect, it } from "vitest";
import { isCaptionTrack, scenesRowOf, type RowScene } from "./index.js";

const scenes: RowScene[] = [
  { id: "intro", source: { kind: "kit", component: "title-card" } },
  { id: "words", source: { kind: "kit", component: "caption-words" } },
  { id: "custom", source: { kind: "module" } },
];

function sceneTrack(options: { id: string; sceneIds: string[] }) {
  return {
    id: options.id,
    kind: "scene" as const,
    clips: options.sceneIds.map((sceneId) => ({ sceneId })),
  };
}

const music = { id: "music", kind: "audio" as const, clips: [] };

describe("the scenes row", () => {
  it("is the first scene track that is not a caption track", () => {
    const tracks = [
      music,
      sceneTrack({ id: "captions", sceneIds: ["words"] }),
      sceneTrack({ id: "main", sceneIds: ["intro", "custom"] }),
      sceneTrack({ id: "extra", sceneIds: ["intro"] }),
    ];

    expect(scenesRowOf({ tracks, scenes })?.id).toBe("main");
  });

  it("counts a track with one caption clip and one other clip as a scenes row", () => {
    const tracks = [sceneTrack({ id: "mixed", sceneIds: ["words", "intro"] })];

    expect(scenesRowOf({ tracks, scenes })?.id).toBe("mixed");
  });

  it("counts an empty scene track as a scenes row", () => {
    const empty = sceneTrack({ id: "empty", sceneIds: [] });

    expect(isCaptionTrack({ track: empty, scenes })).toBe(false);
    expect(scenesRowOf({ tracks: [empty], scenes })?.id).toBe("empty");
  });

  it("is missing when each scene track is a caption track", () => {
    const tracks = [music, sceneTrack({ id: "captions", sceneIds: ["words"] })];

    expect(scenesRowOf({ tracks, scenes })).toBeUndefined();
  });
});
