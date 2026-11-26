import {
  scenesRowOf,
  type Edit,
  type ProjectSnapshot,
  type SceneClip,
  type Timeline,
} from "@yumekit/project";
import { shotIdOf } from "../storyPlan/shotOfAsset.js";
import { videoSoundTrackId } from "../timeline/narrationPlan.js";

interface ClipRun {
  shotId: string | undefined;
  clips: SceneClip[];
}

export interface RowOrderChange {
  timeline: Timeline;
  edit: Edit;
}

function videoAssetIdOf(options: {
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

export function shotIdOfClip(options: {
  snapshot: ProjectSnapshot;
  clip: SceneClip;
}): string | undefined {
  const assetId = videoAssetIdOf(options);
  const asset = options.snapshot.assets.find((each) => each.id === assetId);
  return asset === undefined ? undefined : shotIdOf(asset);
}

function runsOf(options: {
  snapshot: ProjectSnapshot;
  clips: SceneClip[];
}): ClipRun[] {
  const runs: ClipRun[] = [];
  for (const clip of options.clips) {
    const shotId = shotIdOfClip({ snapshot: options.snapshot, clip });
    const current = runs.at(-1);
    if (current === undefined || shotId !== undefined) {
      runs.push({ shotId, clips: [clip] });
    } else current.clips.push(clip);
  }
  return runs;
}

function placeOf(options: { run: ClipRun; shotIds: string[] }): number {
  const { shotId } = options.run;
  if (shotId === undefined) return -1;
  const index = options.shotIds.indexOf(shotId);
  return index === -1 ? options.shotIds.length : index;
}

function packedClips(options: {
  clips: SceneClip[];
  firstFrame: number;
}): SceneClip[] {
  let startFrame = options.firstFrame;
  return options.clips.map((clip) => {
    const packed = { ...clip, startFrame };
    startFrame += clip.durationFrames;
    return packed;
  });
}

function countBy(values: string[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const value of values) counts.set(value, (counts.get(value) ?? 0) + 1);
  return counts;
}

function withVideoSounds(options: {
  snapshot: ProjectSnapshot;
  timeline: Timeline;
  after: SceneClip[];
}): Timeline["tracks"] {
  const shown = options.after.flatMap((clip) => {
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

export function rowOrderChangesOf(options: {
  snapshot: ProjectSnapshot;
  shotIds: string[];
}): RowOrderChange[] {
  const { snapshot, shotIds } = options;
  return snapshot.timelines.flatMap((timeline) => {
    const row = scenesRowOf({
      tracks: timeline.tracks,
      scenes: snapshot.scenes,
    });
    if (row === undefined) return [];
    const before = row.clips.toSorted(
      (...[first, second]) => first.startFrame - second.startFrame,
    );
    const ordered = runsOf({ snapshot, clips: before })
      .toSorted(
        (...[first, second]) =>
          placeOf({ run: first, shotIds }) - placeOf({ run: second, shotIds }),
      )
      .flatMap((run) => run.clips);
    if (ordered.every((...[clip, index]) => clip.id === before[index]?.id)) {
      return [];
    }
    const after = packedClips({
      clips: ordered,
      firstFrame: before[0]?.startFrame ?? 0,
    });
    const tracks = withVideoSounds({ snapshot, timeline, after });
    return [
      {
        timeline,
        edit: {
          kind: "setTimeline",
          timeline: {
            ...timeline,
            tracks: tracks.map((track) =>
              track.id === row.id && track.kind === "scene"
                ? { ...track, clips: after }
                : track,
            ),
          },
        },
      },
    ];
  });
}
