import { describe, expect, it } from "vitest";
import {
  clip,
  loaderOf,
  recordingScene,
  shownScenes,
  stageForTest,
  stageProject,
} from "./testing/stageForTest.js";

describe("createStage seeks", () => {
  it("shows the same picture for frames called in any order", async () => {
    const { element, stage } = stageForTest({
      project: stageProject([
        [
          clip({
            id: "one",
            sceneId: "intro",
            startFrame: 0,
            durationFrames: 10,
          }),
          clip({
            id: "two",
            sceneId: "outro",
            startFrame: 10,
            durationFrames: 10,
          }),
        ],
      ]),
      loadScene: loaderOf({
        intro: recordingScene({ sceneId: "intro", events: [] }),
        outro: recordingScene({ sceneId: "outro", events: [] }),
      }),
      mode: "preview",
    });
    const shown: (string | null)[][] = [];
    for (const frame of [15, 2, 15, 2]) {
      await stage.seek(frame);
      shown.push(shownScenes(element));
    }
    expect(shown).toEqual([["outro 5"], ["intro 2"], ["outro 5"], ["intro 2"]]);
  });

  it("shows nothing at a frame with no visible clip", async () => {
    const { element, stage } = stageForTest({
      project: stageProject([
        [
          clip({
            id: "one",
            sceneId: "intro",
            startFrame: 5,
            durationFrames: 5,
          }),
        ],
      ]),
      loadScene: loaderOf({
        intro: recordingScene({ sceneId: "intro", events: [] }),
      }),
      mode: "preview",
    });
    await stage.seek(6);
    await stage.seek(10);
    expect(shownScenes(element)).toEqual([]);
  });

  it("rejects the seek when a scene fails, and seeks again after it", async () => {
    const { stage } = stageForTest({
      project: stageProject([
        [
          clip({
            id: "one",
            sceneId: "broken",
            startFrame: 0,
            durationFrames: 5,
          }),
        ],
        [
          clip({
            id: "two",
            sceneId: "intro",
            startFrame: 5,
            durationFrames: 5,
          }),
        ],
      ]),
      loadScene: loaderOf({
        intro: recordingScene({ sceneId: "intro", events: [] }),
      }),
      mode: "preview",
    });
    await expect(stage.seek(0)).rejects.toThrow("No scene broken");
    await expect(stage.seek(6)).resolves.toBeUndefined();
  });
});
