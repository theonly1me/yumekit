import {
  scenesRowOf,
  type Edit,
  type ProjectSnapshot,
  type SceneClip,
  type Timeline,
} from "@yumekit/project";
import { z } from "zod";
import { applyEditsResult } from "../applyEditsResult.js";
import type { HarnessContext } from "../context.js";
import { idInput } from "../inputs.js";
import { findOutput } from "../lookups.js";
import {
  failureResult,
  type HarnessFailure,
  type Outcome,
} from "../results.js";
import {
  transitionFramesInput,
  transitionKindInput,
  transitionOf,
} from "./wireTransition.js";

type TransitionChange = ReturnType<typeof transitionOf>;

function hasClipBefore(options: {
  clips: SceneClip[];
  clip: SceneClip;
}): boolean {
  return options.clips.some(
    (other) =>
      other.startFrame + other.durationFrames === options.clip.startFrame,
  );
}

function clipWithTransition(options: {
  clip: SceneClip;
  change: TransitionChange;
}): SceneClip {
  const { clip, change } = options;
  if (change.kind !== "cut") return { ...clip, transition: change };
  return {
    id: clip.id,
    sceneId: clip.sceneId,
    startFrame: clip.startFrame,
    durationFrames: clip.durationFrames,
    sceneStartFrame: clip.sceneStartFrame,
  };
}

function timelinesOf(options: {
  snapshot: ProjectSnapshot;
  outputIds: string[] | undefined;
}): Outcome<Timeline[], HarnessFailure> {
  const { snapshot } = options;
  if (options.outputIds === undefined) {
    return { ok: true, value: snapshot.timelines };
  }
  const timelines: Timeline[] = [];
  for (const outputId of new Set(options.outputIds)) {
    const found = findOutput({ snapshot, outputId });
    if (!found.ok) return found;
    timelines.push(found.value.timeline);
  }
  return { ok: true, value: timelines };
}

function changedTimeline(options: {
  snapshot: ProjectSnapshot;
  timeline: Timeline;
  clipIds: Set<string> | undefined;
  change: TransitionChange;
}): { timeline: Timeline; clipIds: string[] } | undefined {
  const { timeline, clipIds, change } = options;
  const row = scenesRowOf({
    tracks: timeline.tracks,
    scenes: options.snapshot.scenes,
  });
  if (row === undefined) return undefined;
  const isChanged = (clip: SceneClip) =>
    (clipIds === undefined || clipIds.has(clip.id)) &&
    hasClipBefore({ clips: row.clips, clip });
  const changed = row.clips.filter(isChanged).map((clip) => clip.id);
  if (changed.length === 0) return undefined;
  const tracks = timeline.tracks.map((track) =>
    track.id === row.id && track.kind === "scene"
      ? {
          ...track,
          clips: track.clips.map((clip) =>
            isChanged(clip) ? clipWithTransition({ clip, change }) : clip,
          ),
        }
      : track,
  );
  return { timeline: { ...timeline, tracks }, clipIds: changed };
}

const noClipFailure: HarnessFailure = {
  kind: "clip-not-found",
  message:
    "No scene clip of the scenes row matches, or each matching clip is the first clip of its row or comes after a gap.",
  hint: "Call get_timeline. A transition goes on a clip of the scenes row that starts where the clip before it ends.",
};

export function registerSetTransitions(context: HarnessContext): void {
  context.tools.add({
    name: "set_transitions",
    description:
      "Set one transition kind for each scene of the video in one call: each clip of the scenes row that starts where the clip before it ends. The first clip gets none. Use kind cut to remove the transitions. The voice, the music, and the captions do not move. One undo reverts the change in each output.",
    inputSchema: {
      output_ids: z
        .array(idInput("The id of an output."))
        .min(1)
        .optional()
        .describe("The outputs to change. Default: each output."),
      clip_ids: z
        .array(idInput("The id of a clip on the scenes row."))
        .min(1)
        .optional()
        .describe(
          "Only these clips get the transition from the clip before them. Default: each clip of the scenes row.",
        ),
      kind: transitionKindInput,
      duration_frames: transitionFramesInput,
    },
    run: ({ input }) => {
      const snapshot = context.store.read();
      const timelines = timelinesOf({ snapshot, outputIds: input.output_ids });
      if (!timelines.ok) return failureResult(timelines.failure);
      const change = transitionOf({
        wire: input,
        framesPerSecond: snapshot.project.framesPerSecond,
      });
      const clipIds =
        input.clip_ids === undefined ? undefined : new Set(input.clip_ids);
      const changes = timelines.value.flatMap(
        (timeline) =>
          changedTimeline({ snapshot, timeline, clipIds, change }) ?? [],
      );
      if (changes.length === 0) return failureResult(noClipFailure);
      const edits: Edit[] = changes.map(({ timeline }) => ({
        kind: "setTimeline",
        timeline,
      }));
      const durationFrames = change.kind === "cut" ? 0 : change.durationFrames;
      const clipCount = changes.flatMap(
        ({ clipIds: changed }) => changed,
      ).length;
      return applyEditsResult({
        store: context.store,
        edits,
        line: `Transition ${change.kind} set on ${String(clipCount)} scene clips.`,
        data: {
          kind: change.kind,
          duration_frames: durationFrames,
          outputs: changes.map(({ timeline, clipIds: changed }) => ({
            output_id: timeline.outputId,
            clip_ids: changed,
          })),
        },
      });
    },
  });
}
