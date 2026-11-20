import type { ProjectState } from "../format/state.js";
import type { Track } from "../format/timeline.js";
import { succeed } from "../outcome.js";
import type { ClipChanges, EditOfKind } from "./edit.js";
import { problem, type EditProblem, type EditResult } from "./editFailure.js";
import { findTimeline, timelineNotFound, withTimeline } from "./timelines.js";

type TrackChange =
  { ok: true; track: Track } | { ok: false; failure: EditProblem };

function changeClipOnTrack(options: {
  track: Track;
  clipId: string;
  changes: ClipChanges;
}): TrackChange {
  const { track, clipId } = options;
  if (track.kind === "scene") {
    const { assetStartFrame, gainDecibels, ...sceneChanges } = options.changes;
    if (assetStartFrame !== undefined || gainDecibels !== undefined) {
      return problem({
        kind: "invalid-value",
        message: `The scene clip "${clipId}" has no assetStartFrame and no gainDecibels.`,
      });
    }
    return {
      ok: true,
      track: {
        ...track,
        clips: track.clips.map((clip) =>
          clip.id === clipId ? { ...clip, ...sceneChanges } : clip,
        ),
      },
    };
  }
  const { sceneStartFrame, ...audioChanges } = options.changes;
  if (sceneStartFrame !== undefined) {
    return problem({
      kind: "invalid-value",
      message: `The audio clip "${clipId}" has no sceneStartFrame.`,
    });
  }
  return {
    ok: true,
    track: {
      ...track,
      clips: track.clips.map((clip) =>
        clip.id === clipId ? { ...clip, ...audioChanges } : clip,
      ),
    },
  };
}

function addClipToTrack(options: {
  track: Track;
  clip: EditOfKind<"addClip">["clip"];
}): TrackChange {
  const { track, clip } = options;
  if (track.kind === "scene" && "sceneId" in clip) {
    return { ok: true, track: { ...track, clips: [...track.clips, clip] } };
  }
  if (track.kind === "audio" && "assetId" in clip) {
    return { ok: true, track: { ...track, clips: [...track.clips, clip] } };
  }
  return problem({
    kind: "invalid-value",
    message: `The clip "${clip.id}" does not fit the ${track.kind} track "${track.id}".`,
  });
}

function changeTrack(options: {
  state: ProjectState;
  outputId: string;
  findTrack: (track: Track) => boolean;
  missingMessage: string;
  change: (track: Track) => TrackChange;
}): EditResult {
  const { state } = options;
  const timeline = findTimeline({ state, outputId: options.outputId });
  if (timeline === undefined) {
    return timelineNotFound(options.outputId);
  }
  const track = timeline.tracks.find(options.findTrack);
  if (track === undefined) {
    return problem({ kind: "not-found", message: options.missingMessage });
  }
  const changed = options.change(track);
  if (!changed.ok) {
    return changed;
  }
  const tracks = timeline.tracks.map((existing) =>
    existing === track ? changed.track : existing,
  );
  return succeed(withTimeline({ state, timeline: { ...timeline, tracks } }));
}

function hasClip(clipId: string): (track: Track) => boolean {
  return (track) => track.clips.some((clip) => clip.id === clipId);
}

export function addClip(options: {
  state: ProjectState;
  edit: EditOfKind<"addClip">;
}): EditResult {
  const { edit } = options;
  return changeTrack({
    state: options.state,
    outputId: edit.outputId,
    findTrack: (track) => track.id === edit.trackId,
    missingMessage: `The track "${edit.trackId}" does not exist in the timeline "${edit.outputId}".`,
    change: (track) => addClipToTrack({ track, clip: edit.clip }),
  });
}

export function updateClip(options: {
  state: ProjectState;
  edit: EditOfKind<"updateClip">;
}): EditResult {
  const { edit } = options;
  return changeTrack({
    state: options.state,
    outputId: edit.outputId,
    findTrack: hasClip(edit.clipId),
    missingMessage: `The clip "${edit.clipId}" does not exist in the timeline "${edit.outputId}".`,
    change: (track) =>
      changeClipOnTrack({ track, clipId: edit.clipId, changes: edit.changes }),
  });
}

export function removeClip(options: {
  state: ProjectState;
  edit: EditOfKind<"removeClip">;
}): EditResult {
  const { edit } = options;
  return changeTrack({
    state: options.state,
    outputId: edit.outputId,
    findTrack: hasClip(edit.clipId),
    missingMessage: `The clip "${edit.clipId}" does not exist in the timeline "${edit.outputId}".`,
    change: (track) =>
      track.kind === "scene"
        ? {
            ok: true,
            track: {
              ...track,
              clips: track.clips.filter((clip) => clip.id !== edit.clipId),
            },
          }
        : {
            ok: true,
            track: {
              ...track,
              clips: track.clips.filter((clip) => clip.id !== edit.clipId),
            },
          },
  });
}
