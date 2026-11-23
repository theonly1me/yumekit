import type {
  Asset,
  AudioClip,
  ProjectSnapshot,
  SceneClip,
  Timeline,
  Track,
} from "@yumekit/project";
import { uniqueId } from "../timeline/narrationPlan.js";
import { captionTrackOf, voiceTrackOf } from "./soundRoles.js";

export interface NarrationSwap {
  timeline: Timeline;
  withCaptions: boolean;
  videoTrackIds: string[];
}

function clipIdsOf(tracks: Track[]): string[] {
  return tracks.flatMap((track) => track.clips.map((clip) => clip.id));
}

export function narrationSwapOf(options: {
  snapshot: ProjectSnapshot;
  timeline: Timeline;
  asset: Asset & { durationFrames: number };
  captionSceneId: string | undefined;
  withCaptions: boolean | undefined;
}): NarrationSwap {
  const { snapshot, timeline, asset, captionSceneId } = options;
  const voice = voiceTrackOf({ timeline, assets: snapshot.assets });
  const captions = captionTrackOf({ timeline, snapshot });
  const [firstVoiceClip] = [...(voice?.clips ?? [])].sort(
    (...[first, second]) => first.startFrame - second.startFrame,
  );
  const wantsCaptions =
    options.withCaptions ?? (captions !== undefined || voice === undefined);
  const kept = timeline.tracks.filter(
    (track) => track.id !== voice?.id && track.id !== captions?.id,
  );
  const timing = {
    startFrame: firstVoiceClip?.startFrame ?? 0,
    durationFrames: asset.durationFrames,
  };
  const voiceClip: AudioClip = {
    id: uniqueId({ base: `narration-${asset.id}`, taken: clipIdsOf(kept) }),
    assetId: asset.id,
    ...timing,
    assetStartFrame: 0,
    gainDecibels: firstVoiceClip?.gainDecibels ?? 0,
  };
  const captionClip: SceneClip | undefined =
    wantsCaptions && captionSceneId !== undefined
      ? {
          id: uniqueId({
            base: `captions-${asset.id}`,
            taken: [...clipIdsOf(kept), voiceClip.id],
          }),
          sceneId: captionSceneId,
          ...timing,
          sceneStartFrame: 0,
        }
      : undefined;
  const trackIds = timeline.tracks.map((track) => track.id);
  const tracks = timeline.tracks.flatMap((track): Track[] => {
    if (track.id === voice?.id && track.kind === "audio") {
      return [{ ...track, clips: [voiceClip] }];
    }
    if (track.id !== captions?.id || track.kind !== "scene") return [track];
    return captionClip === undefined
      ? []
      : [{ ...track, clips: [captionClip] }];
  });
  const newCaptionTracks: Track[] =
    captions === undefined && captionClip !== undefined
      ? [
          {
            id: uniqueId({ base: "captions", taken: trackIds }),
            kind: "scene",
            clips: [captionClip],
          },
        ]
      : [];
  const newVoiceTracks: Track[] =
    voice === undefined
      ? [
          {
            id: uniqueId({ base: "narration", taken: trackIds }),
            kind: "audio",
            clips: [voiceClip],
          },
        ]
      : [];
  return {
    timeline: {
      ...timeline,
      tracks: [...tracks, ...newCaptionTracks, ...newVoiceTracks],
    },
    withCaptions: captionClip !== undefined,
    videoTrackIds: kept.map((track) => track.id),
  };
}
