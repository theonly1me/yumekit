import type { Snapshot } from "../../engine/snapshot.js";
import { voiceTrackOf, type AudioTrack } from "../../sound/soundRowFacts.js";
import {
  isCaptionTrack,
  mainSceneClipsOf,
} from "../../timeline/timelineFacts.js";
import type { MediaServers } from "../../tools/mediaServers.js";
import { voiceLinesOf, type VoiceLine } from "./voiceLines.js";

export type { VoiceLine } from "./voiceLines.js";

export interface VoiceFacts {
  track: AudioTrack | undefined;
  lines: VoiceLine[];
  assetIds: string[];
  isOwnRecording: boolean;
  hasCaptions: boolean;
}

export function voiceFactsOf(snapshot: Snapshot): VoiceFacts {
  const { assets, scenes } = snapshot;
  const timeline = snapshot.timelines.find(
    (candidate) => voiceTrackOf({ timeline: candidate, assets }) !== undefined,
  );
  const track =
    timeline === undefined ? undefined : voiceTrackOf({ timeline, assets });
  const sceneClips =
    timeline === undefined ? [] : mainSceneClipsOf({ timeline, scenes });
  const clips = track?.clips ?? [];
  const lines = voiceLinesOf({ track, sceneClips, scenes, assets });
  const voiceAssets = clips.flatMap((clip) =>
    assets.filter((asset) => asset.id === clip.assetId),
  );
  return {
    track,
    lines,
    assetIds: [...new Set(voiceAssets.map((asset) => asset.id))],
    isOwnRecording: voiceAssets.some((asset) => asset.source.kind === "import"),
    hasCaptions:
      timeline?.tracks.some((candidate) =>
        isCaptionTrack({ track: candidate, scenes }),
      ) ?? false,
  };
}

export interface VoiceChoices {
  names: string[];
  current: string | undefined;
}

export function voiceChoicesOf(options: {
  snapshot: Snapshot;
  facts: VoiceFacts;
  servers: MediaServers | undefined;
}): VoiceChoices {
  const [firstAssetId] = options.facts.assetIds;
  const asset = options.snapshot.assets.find(
    (candidate) => candidate.id === firstAssetId,
  );
  if (asset?.source.kind !== "tool") return { names: [], current: undefined };
  const { server, model, input } = asset.source;
  const models =
    options.servers?.servers.find((candidate) => candidate.server === server)
      ?.models ?? [];
  const used =
    models.find((candidate) => candidate.id === model) ??
    models.find(
      (candidate) => candidate.capability === "speech" && candidate.is_default,
    );
  const setting = used?.settings.find(
    (candidate) => candidate.name === "voice" && candidate.kind === "choice",
  );
  if (setting?.kind !== "choice") return { names: [], current: undefined };
  const picked = input["voice"];
  return {
    names: setting.choices,
    current: typeof picked === "string" ? picked : setting.default,
  };
}
