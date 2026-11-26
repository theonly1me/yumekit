import {
  scenesRowOf,
  type Edit,
  type ProjectSnapshot,
  type SceneClip,
  type Timeline,
} from "@yumekit/project";
import { shotIdOf } from "../storyPlan/shotOfAsset.js";
import {
  tracksWithVideoSounds,
  videoAssetIdOf,
} from "../timeline/videoSounds.js";

interface ClipRun {
  shotId: string | undefined;
  clips: SceneClip[];
}

export interface RowOrderChange {
  timeline: Timeline;
  edit: Edit;
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
    const tracks = tracksWithVideoSounds({
      snapshot,
      timeline,
      sceneClips: after,
    });
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
