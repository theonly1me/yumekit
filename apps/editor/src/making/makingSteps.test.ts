import { describe, expect, it } from "vitest";
import type { Snapshot } from "../engine/snapshot.js";
import type { AnswerEntry } from "./firstChat.js";
import { makingStepsOf } from "./makingSteps.js";

const emptySnapshot: Snapshot = {
  revision: 1,
  project: { name: "Tea", framesPerSecond: 30, outputs: [] },
  bible: { cast: [] },
  script: "",
  scenes: [],
  sceneCode: {},
  timelines: [],
  assets: [],
};

function madeAsset(options: { id: string; tool: string }) {
  return {
    id: options.id,
    kind:
      options.tool === "generate_image"
        ? ("image" as const)
        : ("audio" as const),
    hasWords: false,
    source: { kind: "tool" as const, tool: options.tool, input: {} },
  };
}

function answerOf(options: {
  state: AnswerEntry["state"];
  tools: string[];
}): AnswerEntry {
  return {
    kind: "answer",
    id: "answer",
    state: options.state,
    steps: options.tools.map((tool) => ({ tool, state: "done" as const })),
  };
}

describe("the steps of the Making screen", () => {
  it("marks pictures and music done from the made assets, and skips each open step before the last done step", () => {
    const steps = makingStepsOf({
      answer: answerOf({
        state: "running",
        tools: ["generate_asset", "generate_asset"],
      }),
      snapshot: {
        ...emptySnapshot,
        assets: [
          madeAsset({ id: "picture", tool: "generate_image" }),
          madeAsset({ id: "song", tool: "generate_music" }),
        ],
      },
      phase: "whole",
    });

    expect(steps.map((step) => step.state)).toEqual([
      "skipped",
      "done",
      "skipped",
      "done",
      "now",
    ]);
  });

  it("never shows a step as in progress when a later step is done", () => {
    const steps = makingStepsOf({
      answer: answerOf({
        state: "running",
        tools: ["set_script", "put_scene", "put_scene", "set_timeline"],
      }),
      snapshot: emptySnapshot,
      phase: "whole",
    });

    expect(steps.map((step) => `${step.state} ${step.fact}`)).toEqual([
      "done The script is ready",
      "done 2 pictures are ready",
      "skipped Skipped",
      "skipped Skipped",
      "done The video is ready",
    ]);
  });

  it("shows the first open step after the last done step as in progress", () => {
    const steps = makingStepsOf({
      answer: answerOf({ state: "running", tools: ["set_script"] }),
      snapshot: emptySnapshot,
      phase: "whole",
    });

    expect(steps.map((step) => step.state)).toEqual([
      "done",
      "now",
      "waiting",
      "waiting",
      "waiting",
    ]);
  });

  it("skips each step that a failed request never reached, also the last one", () => {
    const steps = makingStepsOf({
      answer: answerOf({ state: "failed", tools: ["set_script"] }),
      snapshot: emptySnapshot,
      phase: "whole",
    });

    expect(steps.map((step) => step.state)).toEqual([
      "done",
      "skipped",
      "skipped",
      "skipped",
      "skipped",
    ]);
  });

  it("counts two scenes as pictures, and puts the video together when the request ends as done", () => {
    const steps = makingStepsOf({
      answer: answerOf({ state: "done", tools: ["put_scene", "put_scene"] }),
      snapshot: emptySnapshot,
      phase: "whole",
    });

    expect(steps.map((step) => `${step.state} ${step.fact}`)).toEqual([
      "skipped Skipped",
      "done 2 pictures are ready",
      "skipped Skipped",
      "skipped Skipped",
      "done The video is ready",
    ]);
  });
});
