import { describe, expect, it } from "vitest";
import {
  clip,
  loaderOf,
  recordingScene,
  stageForTest,
  stageProject,
  type SceneEvent,
} from "./testing/stageForTest.js";

describe("createStage", () => {
  it("mounts each scene when its clip becomes visible and disposes it after", async () => {
    const events: SceneEvent[] = [];
    const { stage } = stageForTest({
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
            durationFrames: 5,
          }),
        ],
      ]),
      loadScene: loaderOf({
        intro: recordingScene({ sceneId: "intro", events }),
        outro: recordingScene({ sceneId: "outro", events }),
      }),
      mode: "preview",
    });
    await stage.seek(3);
    await stage.seek(12);
    expect(events).toEqual([
      { sceneId: "intro", event: "mount" },
      { sceneId: "intro", event: "seek", frame: 3 },
      { sceneId: "intro", event: "dispose" },
      { sceneId: "outro", event: "mount" },
      { sceneId: "outro", event: "seek", frame: 2 },
    ]);
  });

  it("gives each scene the frame inside its clip, counted from sceneStartFrame", async () => {
    const events: SceneEvent[] = [];
    const { stage } = stageForTest({
      project: stageProject([
        [
          clip({
            id: "one",
            sceneId: "intro",
            startFrame: 20,
            durationFrames: 10,
            sceneStartFrame: 4,
          }),
        ],
      ]),
      loadScene: loaderOf({
        intro: recordingScene({ sceneId: "intro", events }),
      }),
      mode: "preview",
    });
    await stage.seek(20);
    await stage.seek(25);
    const seekFrames = events.flatMap((event) =>
      event.event === "seek" ? [event.frame] : [],
    );
    expect(seekFrames).toEqual([4, 9]);
  });

  it("draws the first track at the back and gives each clip its own length", async () => {
    const events: SceneEvent[] = [];
    const { element, stage } = stageForTest({
      project: stageProject([
        [
          clip({
            id: "back",
            sceneId: "intro",
            startFrame: 0,
            durationFrames: 30,
          }),
        ],
        [
          clip({
            id: "front",
            sceneId: "badge",
            startFrame: 0,
            durationFrames: 12,
          }),
        ],
      ]),
      loadScene: loaderOf({
        intro: recordingScene({ sceneId: "intro", events }),
        badge: recordingScene({ sceneId: "badge", events }),
      }),
      mode: "preview",
    });
    await stage.seek(5);
    const paragraphs = [...element.querySelectorAll("p")];
    expect(paragraphs.map((paragraph) => paragraph.dataset["sceneId"])).toEqual(
      ["intro", "badge"],
    );
    expect(
      paragraphs.map((paragraph) => paragraph.dataset["durationFrames"]),
    ).toEqual(["30", "12"]);
    expect(element.getBoundingClientRect()).toMatchObject({
      width: 320,
      height: 180,
    });
  });
});
