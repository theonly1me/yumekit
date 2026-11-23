import { voiceMatchesScript } from "@yumekit/project/voice-script";
import type { Snapshot } from "../engine/snapshot.js";
import { isSoundsTrack } from "./soundRowFacts.js";

const videoSoundTrackId = "video-sound";

export const oldVoiceText = "The voice says an older text.";

function voiceTextsOf(snapshot: Snapshot): string[] {
  const placed = new Set(
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
    if (!placed.has(asset.id) || asset.source.kind !== "tool") return [];
    if (asset.source.tool !== "generate_speech") return [];
    const { text } = asset.source.input;
    return typeof text === "string" ? [text] : [];
  });
}

export function isVoiceOld(snapshot: Snapshot): boolean {
  return !voiceMatchesScript({
    script: snapshot.script,
    voiceTexts: voiceTextsOf(snapshot),
  });
}
