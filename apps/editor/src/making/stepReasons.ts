import type { AnswerEntry } from "./firstChat.js";

export type SoundStepId = "voice" | "music";

export type StepAction =
  "add-a-key" | "use-my-own-music" | "make-the-rest" | "try-again";

export interface StepWhy {
  text: string;
  actions: StepAction[];
}

export const noMusicServiceText =
  "No music yet. Music needs a key, or your own file.";
export const stoppedText = "Stopped before this step.";
export const failedText = "This step did not work.";

const capabilityOfStep: Record<SoundStepId, string> = {
  voice: "speech",
  music: "music",
};

const wordOfStep: Record<SoundStepId, RegExp> = {
  voice: /\b(voice|narration)\b/i,
  music: /\bmusic\b/i,
};

function sentencesOf(text: string): string[] {
  return text
    .replaceAll(/[*_`#>]/g, "")
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence !== "");
}

function failedReasonOf(options: {
  stepId: SoundStepId;
  answer: AnswerEntry;
}): string | undefined {
  const capability = capabilityOfStep[options.stepId];
  const failed = options.answer.steps.findLast(
    (step) =>
      step.state === "failed" &&
      ((step.tool === "generate_asset" && step.capability === capability) ||
        (options.stepId === "voice" && step.tool === "place_narration")),
  );
  if (failed === undefined) return undefined;
  return failed.reason ?? "";
}

export function stepWhyOf(options: {
  stepId: SoundStepId;
  answer: AnswerEntry;
  musicIsReady: boolean;
}): StepWhy | undefined {
  const { stepId, answer } = options;
  const failedReason = failedReasonOf({ stepId, answer });
  if (failedReason !== undefined) {
    return {
      text: failedReason === "" ? failedText : `${failedText} ${failedReason}`,
      actions: ["try-again"],
    };
  }
  if (answer.state === "stopped") {
    return { text: stoppedText, actions: ["make-the-rest"] };
  }
  if (stepId === "music" && !options.musicIsReady) {
    return {
      text: noMusicServiceText,
      actions: ["add-a-key", "use-my-own-music"],
    };
  }
  const sentence = sentencesOf(answer.text).find((candidate) =>
    wordOfStep[stepId].test(candidate),
  );
  return sentence === undefined ? undefined : { text: sentence, actions: [] };
}

export interface StepProgress {
  line: string;
  percent: number | undefined;
}

export function stepProgressOf(options: {
  stepId: SoundStepId;
  answer: AnswerEntry;
}): StepProgress | undefined {
  const capability = capabilityOfStep[options.stepId];
  const running = options.answer.steps.findLast(
    (step) =>
      step.state === "running" &&
      step.tool === "generate_asset" &&
      step.capability === capability,
  );
  const progress = running?.progress;
  if (progress?.message === undefined) return undefined;
  const { total } = progress;
  return {
    line: progress.message,
    percent:
      total === undefined || total <= 0
        ? undefined
        : Math.floor((progress.done / total) * 100),
  };
}
