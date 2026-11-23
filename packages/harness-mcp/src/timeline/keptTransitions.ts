import type { SceneTransition, Timeline, Track } from "@yumekit/project";

function transitionsOf(timeline: Timeline | undefined) {
  const transitions = new Map<string, SceneTransition>();
  for (const track of timeline?.tracks ?? []) {
    if (track.kind !== "scene") continue;
    for (const clip of track.clips) {
      if (clip.transition !== undefined)
        transitions.set(clip.id, clip.transition);
    }
  }
  return transitions;
}

export function withKeptTransitions(options: {
  before: Timeline | undefined;
  tracks: Track[];
  givenClipIds: Set<string>;
}): { tracks: Track[]; keptCount: number } {
  const earlier = transitionsOf(options.before);
  let keptCount = 0;
  const tracks = options.tracks.map((track): Track => {
    if (track.kind !== "scene") return track;
    return {
      ...track,
      clips: track.clips.map((clip) => {
        const transition = earlier.get(clip.id);
        if (
          transition === undefined ||
          clip.transition !== undefined ||
          options.givenClipIds.has(clip.id)
        )
          return clip;
        keptCount += 1;
        return { ...clip, transition };
      }),
    };
  });
  return { tracks, keptCount };
}

export function keptLine(keptCount: number): string {
  if (keptCount === 0) return "";
  return keptCount === 1
    ? " It kept 1 transition that the call did not name."
    : ` It kept ${String(keptCount)} transitions that the call did not name.`;
}
