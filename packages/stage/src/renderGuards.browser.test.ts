import { describe, expect, it } from "vitest";
import type { StageOptions } from "./stageProject.js";
import {
  clip,
  recordingScene,
  shownScenes,
  stageForTest,
  stageProject,
} from "./testing/stageForTest.js";

const randomScene = recordingScene({
  sceneId: "noise",
  events: [],
  draw: () => [Math.random(), Math.random()].join(","),
});

function noiseStage(mode: StageOptions["mode"]) {
  return stageForTest({
    project: stageProject([
      [
        clip({
          id: "one",
          sceneId: "noise",
          startFrame: 0,
          durationFrames: 30,
        }),
      ],
    ]),
    loadScene: () => Promise.resolve(randomScene),
    mode,
  });
}

describe("render mode guards", () => {
  it("fixes the clock", () => {
    noiseStage("render");
    const firstNow = Date.now();
    expect(new Date().getTime()).toBe(firstNow);
    expect(Date.now()).toBe(Date.UTC(2000, 0, 1));
    expect(performance.now()).toBe(0);
    expect(new Date(2024, 1, 3).getMonth()).toBe(1);
  });

  it("seeds Math.random from the scene id and the frame", async () => {
    const { element, stage } = noiseStage("render");
    const shown: (string | null)[][] = [];
    for (const frame of [4, 9, 4]) {
      await stage.seek(frame);
      shown.push(shownScenes(element));
    }
    expect(shown[2]).toEqual(shown[0]);
    expect(shown[1]).not.toEqual(shown[0]);
  });

  it("turns off CSS animations and transitions", () => {
    const { element } = noiseStage("render");
    const animated = document.createElement("div");
    animated.style.animation = "spin 2s infinite";
    animated.style.transition = "opacity 1s";
    element.append(animated);
    const style = getComputedStyle(animated);
    expect(style.animationName).toBe("none");
    expect(style.transitionDuration).toBe("0s");
  });

  it("blocks network requests from scene code", async () => {
    noiseStage("render");
    await expect(fetch("/logo.png")).rejects.toThrow("network request");
    expect(() => new XMLHttpRequest()).toThrow("network request");
    expect(() => new WebSocket("ws://localhost:1")).toThrow("network request");
  });

  it("removes every guard on dispose", () => {
    const { stage } = noiseStage("render");
    stage.dispose();
    expect(Date.now()).not.toBe(Date.UTC(2000, 0, 1));
    expect(performance.now()).toBeGreaterThan(0);
    expect(typeof new XMLHttpRequest().open).toBe("function");
    expect(document.querySelector("[data-yumekit-guard]")).toBeNull();
  });

  it("removes every guard on dispose when a scene throws in its dispose", async () => {
    const { stage } = stageForTest({
      project: stageProject([
        [
          clip({
            id: "one",
            sceneId: "bad",
            startFrame: 0,
            durationFrames: 30,
          }),
        ],
      ]),
      loadScene: () =>
        Promise.resolve({
          mount: () =>
            Promise.resolve({
              seek: () => Promise.resolve(),
              dispose: () => {
                throw new Error("The scene broke in dispose");
              },
            }),
        }),
      mode: "render",
    });
    await stage.seek(1);
    expect(() => {
      stage.dispose();
    }).toThrow("The scene broke in dispose");
    expect(Date.now()).not.toBe(Date.UTC(2000, 0, 1));
    expect(typeof new XMLHttpRequest().open).toBe("function");
  });

  it("applies no guard in preview mode", async () => {
    const { element, stage } = noiseStage("preview");
    expect(Date.now()).not.toBe(Date.UTC(2000, 0, 1));
    await stage.seek(4);
    const first = shownScenes(element);
    await stage.seek(4);
    expect(shownScenes(element)).not.toEqual(first);
  });
});
