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

export interface VoicePiece {
  asset: Asset & { durationFrames: number };
  captionSceneId: string | undefined;
}

export interface NarrationSwap {
  timeline: Timeline;
  videoTrackIds: string[];
}

function clipIdsOf(tracks: Track[]): string[] {
  return tracks.flatMap((track) => track.clips.map((clip) => clip.id));
}

function startsOf(options: {
  pieces: VoicePiece[];
  earlierClips: AudioClip[];
}): number[] {
  const { pieces, earlierClips } = options;
  const isLineByLine = pieces.length === earlierClips.length;
  const starts: number[] = [];
  let end = 0;
  for (const [index, piece] of pieces.entries()) {
    const wanted = isLineByLine
      ? (earlierClips[index]?.startFrame ?? end)
      : index === 0
        ? (earlierClips[0]?.startFrame ?? 0)
        : end;
    const start = Math.max(wanted, end);
    starts.push(start);
    end = start + piece.asset.durationFrames;
  }
  return starts;
}

export function narrationSwapOf(options: {
  snapshot: ProjectSnapshot;
  timeline: Timeline;
  pieces: VoicePiece[];
  withCaptions: boolean | undefined;
}): NarrationSwap {
  const { snapshot, timeline, pieces } = options;
  const voice = voiceTrackOf({ timeline, assets: snapshot.assets });
  const captions = captionTrackOf({ timeline, snapshot });
  const earlierClips = [...(voice?.clips ?? [])].sort(
    (...[first, second]) => first.startFrame - second.startFrame,
  );
  const wantsCaptions =
    (options.withCaptions ?? (captions !== undefined || voice === undefined)) &&
    pieces.every((piece) => piece.captionSceneId !== undefined);
  const kept = timeline.tracks.filter(
    (track) => track.id !== voice?.id && track.id !== captions?.id,
  );
  const taken = clipIdsOf(kept);
  const starts = startsOf({ pieces, earlierClips });
  const voiceClips: AudioClip[] = [];
  const captionClips: SceneClip[] = [];
  for (const [index, piece] of pieces.entries()) {
    const timing = {
      startFrame: starts[index] ?? 0,
      durationFrames: piece.asset.durationFrames,
    };
    const voiceClipId = uniqueId({
      base: `narration-${piece.asset.id}`,
      taken,
    });
    taken.push(voiceClipId);
    voiceClips.push({
      id: voiceClipId,
      assetId: piece.asset.id,
      ...timing,
      assetStartFrame: 0,
      gainDecibels:
        earlierClips[index]?.gainDecibels ?? earlierClips[0]?.gainDecibels ?? 0,
    });
    if (wantsCaptions && piece.captionSceneId !== undefined) {
      const captionClipId = uniqueId({
        base: `captions-${piece.asset.id}`,
        taken,
      });
      taken.push(captionClipId);
      captionClips.push({
        id: captionClipId,
        sceneId: piece.captionSceneId,
        ...timing,
        sceneStartFrame: 0,
      });
    }
  }
  const trackIds = timeline.tracks.map((track) => track.id);
  const tracks = timeline.tracks.flatMap((track): Track[] => {
    if (track.id === voice?.id && track.kind === "audio") {
      return [{ ...track, clips: voiceClips }];
    }
    if (track.id !== captions?.id || track.kind !== "scene") return [track];
    return captionClips.length === 0 ? [] : [{ ...track, clips: captionClips }];
  });
  const newCaptionTracks: Track[] =
    captions === undefined && captionClips.length > 0
      ? [
          {
            id: uniqueId({ base: "captions", taken: trackIds }),
            kind: "scene",
            clips: captionClips,
          },
        ]
      : [];
  const newVoiceTracks: Track[] =
    voice === undefined
      ? [
          {
            id: uniqueId({ base: "narration", taken: trackIds }),
            kind: "audio",
            clips: voiceClips,
          },
        ]
      : [];
  return {
    timeline: {
      ...timeline,
      tracks: [...tracks, ...newCaptionTracks, ...newVoiceTracks],
    },
    videoTrackIds: kept.map((track) => track.id),
  };
}
