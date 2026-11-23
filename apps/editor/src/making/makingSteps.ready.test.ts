import { describe, expect, it } from "vitest";
import type { Snapshot } from "../engine/snapshot.js";
import { makingStepsOf } from "./makingSteps.js";

const voiceAsset = {
  id: "voice",
  kind: "audio" as const,
  hasWords: true,
  source: {
    kind: "tool" as const,
    tool: "generate_speech",
    input: { text: "Meet Hoshi." },
  },
};

const snapshotWithVoice: Snapshot = {
  revision: 1,
  project: { name: "Tea", framesPerSecond: 30, outputs: [] },
  bible: { cast: [] },
  script: "Meet Hoshi.",
  scenes: [],
  sceneCode: {},
  timelines: [
    {
      outputId: "wide",
      tracks: [
        {
          id: "narration",
          kind: "audio",
          clips: [
            {
              id: "voice-clip",
              assetId: "voice",
              startFrame: 0,
              durationFrames: 30,
              assetStartFrame: 0,
              gainDecibels: 0,
            },
          ],
        },
      ],
    },
  ],
  assets: [voiceAsset],
};

describe("a done step of the Making screen", () => {
  it("shows the voice as ready when the voice is in the video, also when the AI placed it with another tool and wrote a sentence about it", () => {
    const steps = makingStepsOf({
      answer: {
        kind: "answer",
        id: "answer",
        state: "done",
        text: "I placed the voice under each scene.",
        steps: [{ tool: "set_timeline", state: "done" }],
      },
      snapshot: snapshotWithVoice,
      phase: "whole",
      musicIsReady: true,
    });

    expect(steps.find((step) => step.id === "voice")).toMatchObject({
      state: "done",
      fact: "The voice is ready",
    });
  });

  it("counts the pictures of the scenes and leaves the caption scenes out", () => {
    const sceneOf = (options: { id: string; component: string }) => ({
      id: options.id,
      title: options.id,
      notes: "",
      source: {
        kind: "kit" as const,
        component: options.component,
        props: {},
      },
    });
    const steps = makingStepsOf({
      answer: {
        kind: "answer",
        id: "answer",
        state: "done",
        text: "",
        steps: [
          { tool: "put_scene", state: "done" },
          { tool: "put_scene", state: "done" },
          { tool: "put_scene", state: "done" },
        ],
      },
      snapshot: {
        ...snapshotWithVoice,
        scenes: [
          sceneOf({ id: "hook", component: "title-card" }),
          sceneOf({ id: "product", component: "title-card" }),
          sceneOf({ id: "captions-voice", component: "caption-words" }),
        ],
      },
      phase: "whole",
      musicIsReady: true,
    });

    expect(steps.find((step) => step.id === "pictures")?.fact).toBe(
      "2 pictures are ready",
    );
  });
});
