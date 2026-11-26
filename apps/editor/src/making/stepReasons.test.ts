import { describe, expect, it } from "vitest";
import type { AnswerEntry, AnswerStep } from "./answerTypes.js";
import { stepProgressOf, stepWhyOf, type SoundStepId } from "./stepReasons.js";

function answerOf(options: {
  state: AnswerEntry["state"];
  steps: AnswerStep[];
  text?: string;
}): AnswerEntry {
  return {
    kind: "answer",
    id: "answer",
    text: options.text ?? "",
    state: options.state,
    steps: options.steps,
  };
}

function whyOf(options: {
  stepId: SoundStepId;
  state: AnswerEntry["state"];
  steps: AnswerStep[];
  text?: string;
  musicIsReady?: boolean;
}) {
  return stepWhyOf({
    stepId: options.stepId,
    answer: answerOf(options),
    musicIsReady: options.musicIsReady ?? true,
  });
}

const scriptDone: AnswerStep = { tool: "set_script", state: "done" };

describe("the reason of a step that the AI did not do", () => {
  it("says that music needs a key or a file, with the two actions, when no music service is ready", () => {
    expect(
      whyOf({
        stepId: "music",
        state: "done",
        steps: [scriptDone],
        musicIsReady: false,
      }),
    ).toEqual({
      text: "No music yet. Music needs a key, or your own file.",
      actions: ["add-a-key", "use-my-own-music"],
    });
  });

  it("says that the person stopped the request, with Make the rest", () => {
    expect(
      whyOf({ stepId: "voice", state: "stopped", steps: [scriptDone] }),
    ).toEqual({
      text: "Stopped before this step.",
      actions: ["make-the-rest"],
    });
  });

  it("gives the plain reason of a failed voice call, with Try again", () => {
    const why = whyOf({
      stepId: "voice",
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

    expect(why).toEqual({
      text: "This step did not work. The voice needs one download. Connect to the internet and try again.",
      actions: ["try-again"],
    });
  });

  it("gives the first sentence of the AI about a step that it left out, with no action", () => {
    const why = whyOf({
      stepId: "music",
      state: "done",
      steps: [scriptDone],
      text: "The video is ready. I left out **the music**, because you asked for a quiet ad. Tell me if you want some.",
    });

    expect(why).toEqual({
      text: "I left out the music, because you asked for a quiet ad.",
      actions: [],
    });
  });

  it("gives the download line of the natural voice with its percent while it runs", () => {
    const progress = stepProgressOf({
      stepId: "voice",
      answer: answerOf({
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
      }),
    });

    expect(progress).toEqual({
      line: "Getting the natural voice, one time, 148 MB",
      percent: 25,
    });
  });

  it("gives no reason when nothing explains the step", () => {
    expect(
      whyOf({ stepId: "voice", state: "done", steps: [scriptDone] }),
    ).toBeUndefined();
  });
});
