import type { Track } from "@yumekit/project";

export const soundsTrackId = "sounds";

const soundsTrackPattern = /^sounds(-\d+)?$/;

export function isSoundsTrack(track: Track): boolean {
  return track.kind === "audio" && soundsTrackPattern.test(track.id);
}
