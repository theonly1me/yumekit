import type { Timeline } from "@yumekit/project";

export function sceneIdsAt(options: {
  timeline: Timeline;
  frame: number;
}): string[] {
  const { timeline, frame } = options;
  return timeline.tracks.flatMap((track) =>
    track.kind === "scene"
      ? track.clips
          .filter(
            (clip) =>
              clip.startFrame <= frame &&
              frame < clip.startFrame + clip.durationFrames,
          )
          .map((clip) => clip.sceneId)
      : [],
  );
}

export function sceneIdsOfOutput(timeline: Timeline): Set<string> {
  return new Set(
    timeline.tracks.flatMap((track) =>
      track.kind === "scene" ? track.clips.map((clip) => clip.sceneId) : [],
    ),
  );
}
