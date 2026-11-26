import type { ProjectSnapshot, SceneClip, Timeline } from "@yumekit/project";
import { videoSoundTrackId } from "./narrationPlan.js";

export function videoAssetIdOf(options: {
  snapshot: ProjectSnapshot;
  clip: SceneClip;
}): string | undefined {
  const scene = options.snapshot.scenes.find(
    (candidate) => candidate.id === options.clip.sceneId,
  );
  if (scene?.source.kind !== "kit") return undefined;
  if (scene.source.component !== "video-clip") return undefined;
  const assetId = scene.source.props["assetId"];
  return typeof assetId === "string" ? assetId : undefined;
}

function countBy(values: string[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const value of values) counts.set(value, (counts.get(value) ?? 0) + 1);
  return counts;
}

export function tracksWithVideoSounds(options: {
  snapshot: ProjectSnapshot;
  timeline: Timeline;
  sceneClips: SceneClip[];
}): Timeline["tracks"] {
  const shown = options.sceneClips.flatMap((clip) => {
    const assetId = videoAssetIdOf({ snapshot: options.snapshot, clip });
    return assetId === undefined ? [] : [{ assetId, clip }];
  });
  const shownCounts = countBy(shown.map((entry) => entry.assetId));
  return options.timeline.tracks.map((track) => {
    if (track.kind !== "audio" || track.id !== videoSoundTrackId) return track;
    const soundCounts = countBy(track.clips.map((clip) => clip.assetId));
    return {
      ...track,
      clips: track.clips.map((sound) => {
        const scene = shown.find((entry) => entry.assetId === sound.assetId);
        const isOnlyPair =
          shownCounts.get(sound.assetId) === 1 &&
          soundCounts.get(sound.assetId) === 1;
        if (scene === undefined || !isOnlyPair) return sound;
        return {
          ...sound,
          startFrame: scene.clip.startFrame,
          durationFrames: Math.min(
            sound.durationFrames,
            scene.clip.durationFrames,
          ),
        };
      }),
    };
  });
}
