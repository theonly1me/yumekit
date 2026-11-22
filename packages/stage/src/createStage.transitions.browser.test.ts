import { describe, expect, it } from "vitest";
import {
  clip,
  loaderOf,
  recordingScene,
  shownLayers,
  stageForTest,
  stageProject,
} from "./testing/stageForTest.js";

const scenes = loaderOf({
  intro: recordingScene({ sceneId: "intro", events: [] }),
  outro: recordingScene({ sceneId: "outro", events: [] }),
  badge: recordingScene({ sceneId: "badge", events: [] }),
});

function twoClips(options: {
  kind: "fade" | "slide" | "wipe" | "zoom";
  durationFrames: number;
  gapFrames?: number;
}) {
  return [
    clip({ id: "one", sceneId: "intro", startFrame: 0, durationFrames: 10 }),
    clip({
      id: "two",
      sceneId: "outro",
      startFrame: 10 + (options.gapFrames ?? 0),
      durationFrames: 10,
      transition: {
        kind: options.kind,
        durationFrames: options.durationFrames,
      },
    }),
  ];
}

const whole = { opacity: "", transform: "", clipPath: "" };

describe("createStage transitions", () => {
  it("draws the old clip at its last frame behind the new clip from its frame 0 during a fade", async () => {
    const { element, stage } = stageForTest({
      project: stageProject([twoClips({ kind: "fade", durationFrames: 3 })]),
      loadScene: scenes,
      mode: "preview",
    });
    await stage.seek(11);
    const layers = shownLayers(element);
    expect(layers.map((layer) => layer.text)).toEqual(["intro 9", "outro 1"]);
    const [, entering] = layers;
    expect(Number(entering?.opacity)).toBeCloseTo(0.5, 6);
  });

  it("gives the frame before and the frame after the transition the picture of a cut", async () => {
    const { element, stage } = stageForTest({
      project: stageProject([twoClips({ kind: "slide", durationFrames: 3 })]),
      loadScene: scenes,
      mode: "preview",
    });
    await stage.seek(9);
    expect(shownLayers(element)).toEqual([{ text: "intro 9", ...whole }]);
    await stage.seek(13);
    expect(shownLayers(element)).toEqual([{ text: "outro 3", ...whole }]);
  });

  it("gives a frame inside the transition the same layers after a seek from any earlier frame", async () => {
    const { element, stage } = stageForTest({
      project: stageProject([twoClips({ kind: "zoom", durationFrames: 4 })]),
      loadScene: scenes,
      mode: "preview",
    });
    const shown = [];
    for (const frame of [12, 18, 12, 3, 12, 11, 12]) {
      await stage.seek(frame);
      if (frame === 12) shown.push(shownLayers(element));
    }
    const [first] = shown;
    expect(shown).toEqual([first, first, first, first]);
    expect(first?.map((layer) => layer.text)).toEqual(["intro 9", "outro 2"]);
  });

  it("moves the old clip out to the left while the new one comes in from the right, 1 pixel over it, on a slide", async () => {
    const { element, stage } = stageForTest({
      project: stageProject([twoClips({ kind: "slide", durationFrames: 3 })]),
      loadScene: scenes,
      mode: "preview",
    });
    await stage.seek(11);
    expect(shownLayers(element).map((layer) => layer.transform)).toEqual([
      "translateX(-160px)",
      "translateX(159px)",
    ]);
  });

  it("does nothing on the first clip, after a gap, or on a clip of another track", async () => {
    const { element, stage } = stageForTest({
      project: stageProject([
        twoClips({ kind: "wipe", durationFrames: 3, gapFrames: 2 }),
        [
          clip({
            id: "front",
            sceneId: "badge",
            startFrame: 0,
            durationFrames: 30,
            transition: { kind: "fade", durationFrames: 5 },
          }),
        ],
      ]),
      loadScene: scenes,
      mode: "preview",
    });
    await stage.seek(0);
    expect(shownLayers(element)).toEqual([
      { text: "intro 0", ...whole },
      { text: "badge 0", ...whole },
    ]);
    await stage.seek(12);
    expect(shownLayers(element)).toEqual([
      { text: "outro 0", ...whole },
      { text: "badge 12", ...whole },
    ]);
  });

  it("limits the transition to half of the shorter clip", async () => {
    const { element, stage } = stageForTest({
      project: stageProject([twoClips({ kind: "fade", durationFrames: 40 })]),
      loadScene: scenes,
      mode: "preview",
    });
    await stage.seek(14);
    expect(shownLayers(element).map((layer) => layer.text)).toEqual([
      "intro 9",
      "outro 4",
    ]);
    await stage.seek(15);
    expect(shownLayers(element).map((layer) => layer.text)).toEqual([
      "outro 5",
    ]);
  });
});
