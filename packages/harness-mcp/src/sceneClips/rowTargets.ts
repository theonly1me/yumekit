import {
  scenesRowOf,
  type ProjectSnapshot,
  type SceneClip,
  type Timeline,
} from "@yumekit/project";
import { findOutput } from "../lookups.js";
import type { HarnessFailure, Outcome } from "../results.js";

export interface RowTarget {
  timeline: Timeline;
  trackId: string;
  clips: SceneClip[];
  clipIndex: number;
}

const rowRule =
  "The scenes row is the first scene track that is not a caption track.";

function rowTargetOf(options: {
  snapshot: ProjectSnapshot;
  timeline: Timeline;
  clipId: string;
}): RowTarget | undefined {
  const row = scenesRowOf({
    tracks: options.timeline.tracks,
    scenes: options.snapshot.scenes,
  });
  if (row === undefined) return undefined;
  const clips = [...row.clips].sort(
    (...[first, second]) => first.startFrame - second.startFrame,
  );
  const clipIndex = clips.findIndex((clip) => clip.id === options.clipId);
  return clipIndex === -1
    ? undefined
    : { timeline: options.timeline, trackId: row.id, clips, clipIndex };
}

function hasClip(options: { timeline: Timeline; clipId: string }): boolean {
  return options.timeline.tracks.some((track) =>
    track.clips.some((clip) => clip.id === options.clipId),
  );
}

function missingClipFailure(options: {
  timelines: Timeline[];
  clipId: string;
}): HarnessFailure {
  const { timelines, clipId } = options;
  const outputIds = timelines.map((timeline) => timeline.outputId).join(", ");
  if (timelines.some((timeline) => hasClip({ timeline, clipId }))) {
    return {
      kind: "clip-not-on-scenes-row",
      message: `The clip "${clipId}" is not on the scenes row of the output ${outputIds}. ${rowRule}`,
      hint: "Use update_clip or remove_clip for a clip on another track. Call get_timeline to see the clips of the scenes row.",
    };
  }
  return {
    kind: "clip-not-found",
    message: `The output ${outputIds} has no clip "${clipId}".`,
    hint: `Call get_timeline and use the id of a clip on the scenes row. ${rowRule}`,
  };
}

export function rowTargetsOf(options: {
  snapshot: ProjectSnapshot;
  clipId: string;
  outputIds: string[] | undefined;
}): Outcome<RowTarget[], HarnessFailure> {
  const { snapshot, clipId } = options;
  if (options.outputIds === undefined) {
    const targets = snapshot.timelines.flatMap(
      (timeline) => rowTargetOf({ snapshot, timeline, clipId }) ?? [],
    );
    return targets.length > 0
      ? { ok: true, value: targets }
      : {
          ok: false,
          failure: missingClipFailure({
            timelines: snapshot.timelines,
            clipId,
          }),
        };
  }
  const targets: RowTarget[] = [];
  for (const outputId of new Set(options.outputIds)) {
    const found = findOutput({ snapshot, outputId });
    if (!found.ok) return found;
    const { timeline } = found.value;
    const target = rowTargetOf({ snapshot, timeline, clipId });
    if (target === undefined) {
      return {
        ok: false,
        failure: missingClipFailure({ timelines: [timeline], clipId }),
      };
    }
    targets.push(target);
  }
  return { ok: true, value: targets };
}
