import { describe, expect, it } from "vitest";
import type { Asset, Scene } from "../index.js";
import { planOf } from "../testing/takeFixtures.js";
import { chapterFramesOf, chapterIdsOfClips } from "./index.js";

function clipAsset(shotId: string): Asset {
  return {
    id: `${shotId}-clip`,
    kind: "video",
    file: `assets/files/${shotId}-clip.mp4`,
    contentHash: "sha256:0",
    durationFrames: 120,
    hasWords: false,
    source: {
      kind: "tool",
      server: "sample",
      tool: "generate_video",
      input: { prompt: shotId, shot_id: shotId },
    },
  };
}

function videoScene(shotId: string): Scene {
  return {
    id: `video-${shotId}-clip`,
    title: shotId,
    notes: "",
    source: {
      kind: "kit",
      component: "video-clip",
      props: { assetId: `${shotId}-clip` },
    },
  };
}

const titleCard: Scene = {
  id: "title",
  title: "Title",
  notes: "",
  source: { kind: "kit", component: "title-card", props: { text: "Fog" } },
};

const plan = {
  ...planOf(["a", "b", "c"]),
  chapters: [
    { id: "harbor", title: "The harbor", shotIds: ["a"] },
    { id: "crossing", title: "The crossing", shotIds: ["b", "c"] },
  ],
};

const row = [
  { id: "open", sceneId: "title", startFrame: 0, durationFrames: 30 },
  { id: "shot-a", sceneId: "video-a-clip", startFrame: 30, durationFrames: 90 },
  { id: "card", sceneId: "title", startFrame: 120, durationFrames: 30 },
  {
    id: "shot-b",
    sceneId: "video-b-clip",
    startFrame: 150,
    durationFrames: 60,
  },
  {
    id: "shot-c",
    sceneId: "video-c-clip",
    startFrame: 210,
    durationFrames: 90,
  },
  { id: "end", sceneId: "title", startFrame: 300, durationFrames: 45 },
].map((clip) => ({ ...clip, sceneStartFrame: 0 }));

const work = {
  bible: { storyPlan: plan },
  scenes: [titleCard, ...["a", "b", "c"].map(videoScene)],
  assets: ["a", "b", "c"].map(clipAsset),
  timelines: [
    {
      outputId: "wide",
      tracks: [{ id: "main", kind: "scene" as const, clips: row }],
    },
  ],
};

describe("the time of a chapter", () => {
  it("a scene with no shot belongs to the chapter of the shot before it, or to the first chapter", () => {
    expect([...chapterIdsOfClips({ work, outputId: "wide" })]).toEqual([
      ["open", "harbor"],
      ["shot-a", "harbor"],
      ["card", "harbor"],
      ["shot-b", "crossing"],
      ["shot-c", "crossing"],
      ["end", "crossing"],
    ]);
  });

  it("a chapter runs from its first clip to the end of its last", () => {
    expect(
      chapterFramesOf({ work, outputId: "wide", chapterId: "crossing" }),
    ).toEqual({ firstFrame: 150, frameCount: 195 });
    expect(
      chapterFramesOf({ work, outputId: "wide", chapterId: "nowhere" }),
    ).toBeUndefined();
  });
});
