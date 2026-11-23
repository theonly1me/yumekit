import { describe, expect, it } from "vitest";
import type { Snapshot } from "../engine/snapshot.js";
import type { AnswerEntry, AnswerStep } from "./firstChat.js";
import { makingStepsOf } from "./makingSteps.js";

const snapshot: Snapshot = {
  revision: 1,
  project: { name: "Tea", framesPerSecond: 30, outputs: [] },
  bible: { cast: [] },
  script: "",
  scenes: [],
  sceneCode: {},
  timelines: [],
  assets: [],
};

function stepsOf(options: {
  state: AnswerEntry["state"];
  steps: AnswerStep[];
  text?: string;
  musicIsReady?: boolean;
}) {
  const steps = makingStepsOf({
    answer: {
      kind: "answer",
      id: "answer",
      text: options.text ?? "",
      state: options.state,
      steps: options.steps,
    },
    snapshot,
    phase: "whole",
    musicIsReady: options.musicIsReady ?? true,
  });
  return {
    voice: steps.find((step) => step.id === "voice"),
    music: steps.find((step) => step.id === "music"),
  };
}

const scriptDone: AnswerStep = { tool: "set_script", state: "done" };

describe("the reason of a step that the AI did not do", () => {
  it("says that music needs a key or a file, with the two actions, when no music service is ready", () => {
    const { music } = stepsOf({
      state: "done",
      steps: [scriptDone],
      musicIsReady: false,
    });

    expect(music).toMatchObject({
      state: "skipped",
      fact: "",
      why: {
        text: "No music yet. Music needs a key, or your own file.",
        actions: ["add-a-key", "use-my-own-music"],
      },
    });
  });

  it("says that the person stopped the request, with Make the rest", () => {
    const { voice } = stepsOf({ state: "stopped", steps: [scriptDone] });

    expect(voice?.why).toEqual({
      text: "Stopped before this step.",
      actions: ["make-the-rest"],
    });
  });

  it("gives the plain reason of a failed voice call, with Try again", () => {
    const { voice } = stepsOf({
      state: "done",
      steps: [
        scriptDone,
        {
          tool: "generate_asset",
          state: "failed",
          capability: "speech",
          reason:
            "The voice needs one download. Connect to the internet and try again.",
        },
      ],
    });

    expect(voice?.why).toEqual({
      text: "This step did not work. The voice needs one download. Connect to the internet and try again.",
      actions: ["try-again"],
    });
  });

  it("gives the first sentence of the AI about a step that it left out, with no action", () => {
    const { music } = stepsOf({
      state: "done",
      steps: [scriptDone],
      text: "The video is ready. I left out **the music**, because you asked for a quiet ad. Tell me if you want some.",
    });

    expect(music?.why).toEqual({
      text: "I left out the music, because you asked for a quiet ad.",
      actions: [],
    });
  });

  it("shows the download line of the natural voice with its percent on the voice step while it runs", () => {
    const { voice } = stepsOf({
      state: "running",
      steps: [
        scriptDone,
        {
          tool: "generate_asset",
          state: "running",
          capability: "speech",
          progress: {
            done: 37_000_000,
            total: 148_000_000,
            message: "Getting the natural voice, one time, 148 MB",
          },
        },
      ],
    });

    expect(voice).toMatchObject({
      state: "now",
      fact: "Working",
      progress: {
        line: "Getting the natural voice, one time, 148 MB",
        percent: 25,
      },
    });
  });

  it("still says Skipped when nothing explains the step", () => {
    const { voice } = stepsOf({ state: "done", steps: [scriptDone] });

    expect(voice).toMatchObject({ state: "skipped", fact: "Skipped" });
  });
});
