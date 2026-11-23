import type { ProjectState } from "../format/state.js";
import type { MadeBy, SceneClip, Timeline, Track } from "../format/timeline.js";
import {
  clipsOf,
  haveSameTiming,
  haveSameTrackState,
  haveSameTransition,
  withMark,
  workKeyOf,
  type Clip,
} from "./clipFacts.js";

interface Marking {
  by: MadeBy | undefined;
  earlierClipOf: (clip: Clip) => Clip | undefined;
}

function markOf(options: {
  earlierMark: MadeBy | undefined;
  isNew: boolean;
  isChanged: boolean;
  by: MadeBy | undefined;
}): MadeBy | undefined {
  if (options.isNew) return options.by;
  if (options.isChanged && options.by === "person") return "person";
  return options.earlierMark;
}

function earlierClipFinder(options: {
  before: Timeline | undefined;
  after: Timeline;
}): (clip: Clip) => Clip | undefined {
  const earlierClips = clipsOf(options.before);
  const laterIds = new Set(clipsOf(options.after).map((clip) => clip.id));
  const takenByKey = new Set<string>();
  const found = new Map<string, Clip | undefined>();
  const find = (clip: Clip): Clip | undefined => {
    const sameId = earlierClips.find((earlier) => earlier.id === clip.id);
    if (sameId !== undefined) {
      return workKeyOf(sameId) === workKeyOf(clip) ? sameId : undefined;
    }
    const sameWork = earlierClips.find(
      (earlier) =>
        !laterIds.has(earlier.id) &&
        !takenByKey.has(earlier.id) &&
        workKeyOf(earlier) === workKeyOf(clip),
    );
    if (sameWork !== undefined) takenByKey.add(sameWork.id);
    return sameWork;
  };
  return (clip) => {
    if (!found.has(clip.id)) found.set(clip.id, find(clip));
    return found.get(clip.id);
  };
}

function markedClip<ClipType extends Clip>(options: {
  clip: ClipType;
  marking: Marking;
}) {
  const { clip, marking } = options;
  const earlier = marking.earlierClipOf(clip);
  return withMark({
    value: clip,
    mark: markOf({
      earlierMark: earlier?.madeBy,
      isNew: earlier === undefined,
      isChanged:
        earlier !== undefined && !haveSameTiming({ earlier, later: clip }),
      by: marking.by,
    }),
  });
}

function markedSceneClip(options: {
  clip: SceneClip;
  marking: Marking;
}): SceneClip {
  const { clip, marking } = options;
  const marked = markedClip({ clip, marking });
  if (clip.transition === undefined) return marked;
  const earlier = marking.earlierClipOf(clip);
  const earlierTransition =
    earlier !== undefined && "sceneId" in earlier
      ? earlier.transition
      : undefined;
  return {
    ...marked,
    transition: withMark({
      value: clip.transition,
      mark: markOf({
        earlierMark: earlierTransition?.madeBy,
        isNew: earlierTransition?.kind !== clip.transition.kind,
        isChanged: !haveSameTransition({
          earlier: earlierTransition,
          later: clip.transition,
        }),
        by: marking.by,
      }),
    }),
  };
}

function byStart<ClipType extends Clip>(clips: ClipType[]): ClipType[] {
  return [...clips].sort(
    (...[first, second]) => first.startFrame - second.startFrame,
  );
}

function markedTrack(options: {
  track: Track;
  before: Timeline | undefined;
  marking: Marking;
}): Track {
  const { track, marking } = options;
  const earlier = options.before?.tracks.find(
    (candidate) => candidate.id === track.id,
  );
  const mark = markOf({
    earlierMark: earlier?.madeBy,
    isNew: earlier === undefined,
    isChanged:
      earlier !== undefined && !haveSameTrackState({ earlier, later: track }),
    by: marking.by,
  });
  if (track.kind === "scene") {
    return withMark({
      value: {
        ...track,
        clips: byStart(
          track.clips.map((clip) => markedSceneClip({ clip, marking })),
        ),
      },
      mark,
    });
  }
  return withMark({
    value: {
      ...track,
      clips: byStart(track.clips.map((clip) => markedClip({ clip, marking }))),
    },
    mark,
  });
}

export function markWork(options: {
  before: ProjectState;
  after: ProjectState;
  by: MadeBy | undefined;
}): ProjectState {
  const { before, after, by } = options;
  return {
    ...after,
    timelines: after.timelines.map((timeline) => {
      const earlierTimeline = before.timelines.find(
        (candidate) => candidate.outputId === timeline.outputId,
      );
      const marking = {
        by,
        earlierClipOf: earlierClipFinder({
          before: earlierTimeline,
          after: timeline,
        }),
      };
      return {
        ...timeline,
        tracks: timeline.tracks.map((track) =>
          markedTrack({ track, before: earlierTimeline, marking }),
        ),
      };
    }),
  };
}
