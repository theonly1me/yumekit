import type { Edit, ProjectSnapshot } from "@yumekit/project";
import { withKeptTransitions } from "./keptTransitions.js";
import { trackOf, type WireTrack } from "./wireTimeline.js";

function transitionClipIdsOf(tracks: WireTrack[]): Set<string> {
  const ids = new Set<string>();
  for (const track of tracks) {
    if (track.kind !== "scene") continue;
    for (const clip of track.clips) {
      if (clip.id !== undefined && clip.transition !== undefined)
        ids.add(clip.id);
    }
  }
  return ids;
}

export function timelineEditOf(options: {
  snapshot: ProjectSnapshot;
  outputId: string;
  tracks: WireTrack[];
}): { edit: Edit; keptCount: number } {
  const { snapshot, outputId, tracks } = options;
  const { framesPerSecond } = snapshot.project;
  const kept = withKeptTransitions({
    before: snapshot.timelines.find(
      (timeline) => timeline.outputId === outputId,
    ),
    tracks: tracks.map((track) => trackOf({ track, framesPerSecond })),
    givenClipIds: transitionClipIdsOf(tracks),
  });
  return {
    edit: { kind: "setTimeline", timeline: { outputId, tracks: kept.tracks } },
    keptCount: kept.keptCount,
  };
}
