import type { ProjectSnapshot } from "@yumekit/project";
import { isSoundsTrack } from "../timeline/soundsTrack.js";
import { videoSoundTrackId } from "../timeline/narrationPlan.js";

export function voiceTextsOf(snapshot: ProjectSnapshot): string[] {
  const placedAssetIds = new Set(
    snapshot.timelines.flatMap((timeline) =>
      timeline.tracks.flatMap((track) =>
        track.kind === "audio" &&
        track.id !== videoSoundTrackId &&
        !isSoundsTrack(track)
          ? track.clips.map((clip) => clip.assetId)
          : [],
      ),
    ),
  );
  return snapshot.assets.flatMap((asset) => {
    if (!placedAssetIds.has(asset.id)) return [];
    if (asset.source.kind !== "tool") return [];
    if (asset.source.tool !== "generate_speech") return [];
    const { text } = asset.source.input;
    return typeof text === "string" ? [text] : [];
  });
}
