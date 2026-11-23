import type { Snapshot } from "../engine/snapshot.js";
import { musicTracksOf, voiceTrackOf } from "../sound/soundRowFacts.js";
import type { AnswerEntry, MakingPhase } from "./firstChat.js";
import {
  stepProgressOf,
  stepWhyOf,
  type SoundStepId,
  type StepProgress,
  type StepWhy,
} from "./stepReasons.js";

export type StepState = "waiting" | "now" | "done" | "skipped";

export interface MakingStep {
  id: "script" | "pictures" | "voice" | "music" | "together";
  label: string;
  state: StepState;
  fact: string;
  why?: StepWhy;
  progress?: StepProgress;
}

function isSoundStep(id: MakingStep["id"]): id is SoundStepId {
  return id === "voice" || id === "music";
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

function hasPlaced(options: {
  snapshot: Snapshot;
  part: SoundStepId;
}): boolean {
  const { snapshot, part } = options;
  return snapshot.timelines.some((timeline) => {
    const tracks =
      part === "voice"
        ? [voiceTrackOf({ timeline, assets: snapshot.assets })]
        : musicTracksOf({ timeline, assets: snapshot.assets });
    return tracks.some((track) => (track?.clips.length ?? 0) > 0);
  });
}

const restStepIds = new Set<MakingStep["id"]>(["voice", "music", "together"]);

export function isPlanReady(options: {
  answer: AnswerEntry;
  phase: MakingPhase;
}): boolean {
  return options.phase === "plan" && options.answer.state === "done";
}

export function makingStepsOf(options: {
  answer: AnswerEntry;
  snapshot: Snapshot;
  phase: MakingPhase;
  musicIsReady: boolean;
}): MakingStep[] {
  const { answer, snapshot, phase, musicIsReady } = options;
  const called = (tool: string) => doneCount({ answer, tool }) > 0;
  const hasEnded = answer.state !== "running";
  const isWaitingForContinue = isPlanReady({ answer, phase });
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
      isDone:
        called("place_narration") ||
        called("replace_narration") ||
        hasPlaced({ snapshot, part: "voice" }),
      fact: "The voice is ready",
    },
    {
      id: "music",
      label: "Choose the music",
      isDone:
        (called("generate_asset") &&
          madeAssetCount({ snapshot, tool: "generate_music" }) > 0) ||
        called("replace_music") ||
        hasPlaced({ snapshot, part: "music" }),
      fact: "The music is ready",
    },
    {
      id: "together",
      label: "Put it together",
      isDone:
        phase === "plan"
          ? false
          : answer.state === "done" ||
            (phase === "whole" && called("set_timeline")),
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
    if (isWaitingForContinue && restStepIds.has(step.id))
      return {
        id: step.id,
        label: step.label,
        state: "waiting",
        fact: "Waits for Continue",
      };
    const progress = isSoundStep(step.id)
      ? stepProgressOf({ stepId: step.id, answer })
      : undefined;
    if (progress !== undefined)
      return {
        id: step.id,
        label: step.label,
        state: "now",
        fact: "Working",
        progress,
      };
    if (hasEnded || index < lastDoneIndex) {
      const why = isSoundStep(step.id)
        ? stepWhyOf({ stepId: step.id, answer, musicIsReady })
        : undefined;
      return {
        id: step.id,
        label: step.label,
        state: "skipped",
        fact: why === undefined ? "Skipped" : "",
        ...(why === undefined ? {} : { why }),
      };
    }
    return index === nowIndex
      ? { id: step.id, label: step.label, state: "now", fact: "Working" }
      : { id: step.id, label: step.label, state: "waiting", fact: "" };
  });
}
