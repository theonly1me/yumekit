import type { Snapshot } from "../engine/snapshot.js";
import type { AnswerEntry } from "./firstChat.js";

export type StepState = "waiting" | "now" | "done" | "skipped";

export interface MakingStep {
  id: "script" | "pictures" | "voice" | "music" | "together";
  label: string;
  state: StepState;
  fact: string;
}

function doneCount(options: { answer: AnswerEntry; tool: string }): number {
  return options.answer.steps.filter(
    (step) => step.tool === options.tool && step.state === "done",
  ).length;
}

function madeAssetCount(options: { snapshot: Snapshot; tool: string }) {
  return options.snapshot.assets.filter(
    (asset) =>
      asset.source.kind === "tool" && asset.source.tool === options.tool,
  ).length;
}

function picturesFact(options: {
  snapshot: Snapshot;
  answer: AnswerEntry;
}): string {
  const { snapshot, answer } = options;
  const count = Math.max(
    snapshot.scenes.length,
    madeAssetCount({ snapshot, tool: "generate_image" }),
    doneCount({ answer, tool: "put_scene" }),
  );
  return count === 1
    ? "1 picture is ready"
    : `${String(count)} pictures are ready`;
}

export function makingStepsOf(options: {
  answer: AnswerEntry;
  snapshot: Snapshot;
}): MakingStep[] {
  const { answer, snapshot } = options;
  const called = (tool: string) => doneCount({ answer, tool }) > 0;
  const hasEnded = answer.state !== "running";
  const made = [
    {
      id: "script",
      label: "Write the script",
      isDone: called("set_script"),
      fact: "The script is ready",
    },
    {
      id: "pictures",
      label: "Make the pictures",
      isDone:
        (called("generate_asset") &&
          madeAssetCount({ snapshot, tool: "generate_image" }) > 0) ||
        doneCount({ answer, tool: "put_scene" }) >= 2,
      fact: picturesFact({ snapshot, answer }),
    },
    {
      id: "voice",
      label: "Record the voice",
      isDone: called("place_narration"),
      fact: "The voice is ready",
    },
    {
      id: "music",
      label: "Choose the music",
      isDone:
        called("generate_asset") &&
        madeAssetCount({ snapshot, tool: "generate_music" }) > 0,
      fact: "The music is ready",
    },
    {
      id: "together",
      label: "Put it together",
      isDone: called("set_timeline") || answer.state === "done",
      fact: "The video is ready",
    },
  ] as const;
  const lastDoneIndex = made.findLastIndex((step) => step.isDone);
  const nowIndex = hasEnded
    ? -1
    : made.findIndex(
        (...[step, index]) => !step.isDone && index > lastDoneIndex,
      );
  return made.map((...[step, index]): MakingStep => {
    if (step.isDone)
      return { id: step.id, label: step.label, state: "done", fact: step.fact };
    if (hasEnded || index < lastDoneIndex)
      return {
        id: step.id,
        label: step.label,
        state: "skipped",
        fact: "Skipped",
      };
    return index === nowIndex
      ? { id: step.id, label: step.label, state: "now", fact: "Working" }
      : { id: step.id, label: step.label, state: "waiting", fact: "" };
  });
}
