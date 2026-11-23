import {
  assetLabelOf,
  scenesRowOf,
  type Asset,
  type Edit,
  type ProjectSnapshot,
  type Timeline,
  type Track,
} from "@yumekit/project";
import { uniqueId, videoSoundTrackId } from "./narrationPlan.js";

const videoComponent = "video-clip";
const newSceneTrackId = "scenes";
const idLengthLimit = 64;

export interface VideoPlacement {
  asset: Asset & { durationFrames: number };
  title: string;
  startFrame: number;
  durationFrames: number;
  focus: { x: number; y: number } | undefined;
  soundGainDecibels: number | "off";
}

export interface VideoPlan {
  edits: Edit[];
  sceneId: string;
  sceneClipId: string;
  sceneTrackId: string;
  soundClipId?: string;
}

function sceneEditsOf(options: {
  snapshot: ProjectSnapshot;
  sceneId: string;
  placement: VideoPlacement;
}): Edit[] {
  const { placement, sceneId } = options;
  if (options.snapshot.scenes.some((scene) => scene.id === sceneId)) return [];
  return [
    {
      kind: "putScene",
      scene: {
        id: sceneId,
        title: placement.title,
        notes: "Made by place_video.",
        source: {
          kind: "kit",
          component: videoComponent,
          props: {
            assetId: placement.asset.id,
            ...(placement.focus === undefined
              ? {}
              : { focus: placement.focus }),
          },
        },
      },
    },
  ];
}

function videoTracksEdit(options: {
  timeline: Timeline;
  newTracks: Track[];
}): Edit[] {
  const { timeline, newTracks } = options;
  if (newTracks.length === 0) return [];
  return [
    {
      kind: "setTimeline",
      timeline: {
        outputId: timeline.outputId,
        tracks: [
          ...newTracks.filter((track) => track.kind === "scene"),
          ...timeline.tracks,
          ...newTracks.filter((track) => track.kind === "audio"),
        ],
      },
    },
  ];
}

export function videoTitleOf(options: {
  snapshot: ProjectSnapshot;
  timeline: Timeline;
  asset: Asset;
  replaceClipId: string | undefined;
}): string {
  const replacedSceneId = options.timeline.tracks
    .flatMap((track) => (track.kind === "scene" ? track.clips : []))
    .find((clip) => clip.id === options.replaceClipId)?.sceneId;
  const replacedScene = options.snapshot.scenes.find(
    (scene) => scene.id === replacedSceneId,
  );
  return replacedScene?.title ?? assetLabelOf(options.asset);
}

export function planVideo(options: {
  snapshot: ProjectSnapshot;
  timeline: Timeline;
  placement: VideoPlacement;
}): VideoPlan {
  const { snapshot, timeline, placement } = options;
  const { asset, startFrame, durationFrames } = placement;
  const trackIds = timeline.tracks.map((track) => track.id);
  const clipIds = timeline.tracks.flatMap((track) =>
    track.clips.map((clip) => clip.id),
  );
  const sceneId = `video-${asset.id}`.slice(0, idLengthLimit);
  const newTracks: Track[] = [];
  const sceneTrack =
    scenesRowOf({ tracks: timeline.tracks, scenes: snapshot.scenes }) ??
    ({
      id: uniqueId({ base: newSceneTrackId, taken: trackIds }),
      kind: "scene",
      clips: [],
    } satisfies Track);
  if (!trackIds.includes(sceneTrack.id)) newTracks.push(sceneTrack);
  const sceneClipId = uniqueId({ base: `video-${asset.id}`, taken: clipIds });
  const sceneClipEdit: Edit = {
    kind: "addClip",
    outputId: timeline.outputId,
    trackId: sceneTrack.id,
    clip: {
      id: sceneClipId,
      sceneId,
      startFrame,
      durationFrames,
      sceneStartFrame: 0,
    },
  };
  const plan = {
    sceneId,
    sceneClipId,
    sceneTrackId: sceneTrack.id,
  };
  const sceneEdits = sceneEditsOf({ snapshot, sceneId, placement });
  if (placement.soundGainDecibels === "off" || asset.hasAudio !== true) {
    return {
      ...plan,
      edits: [
        ...sceneEdits,
        ...videoTracksEdit({ timeline, newTracks }),
        sceneClipEdit,
      ],
    };
  }
  const soundTrack = timeline.tracks.find(
    (track) => track.id === videoSoundTrackId,
  ) ?? { id: videoSoundTrackId, kind: "audio" as const, clips: [] };
  if (!trackIds.includes(soundTrack.id)) newTracks.push(soundTrack);
  const soundClipId = uniqueId({
    base: `video-sound-${asset.id}`,
    taken: [...clipIds, sceneClipId],
  });
  const soundClipEdit: Edit = {
    kind: "addClip",
    outputId: timeline.outputId,
    trackId: soundTrack.id,
    clip: {
      id: soundClipId,
      assetId: asset.id,
      startFrame,
      durationFrames: Math.min(durationFrames, asset.durationFrames),
      assetStartFrame: 0,
      gainDecibels: placement.soundGainDecibels,
    },
  };
  return {
    ...plan,
    soundClipId,
    edits: [
      ...sceneEdits,
      ...videoTracksEdit({ timeline, newTracks }),
      sceneClipEdit,
      soundClipEdit,
    ],
  };
}
