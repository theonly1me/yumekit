export interface BeatTwin {
  frameKey: string;
  beatKey: string;
  isLength: boolean;
  meaning: string;
}

export const beatTwins: readonly BeatTwin[] = [
  {
    frameKey: "start_frame",
    beatKey: "start_beat",
    isLength: false,
    meaning: "The start",
  },
  {
    frameKey: "duration_frames",
    beatKey: "duration_beats",
    isLength: true,
    meaning: "The length",
  },
  {
    frameKey: "scene_start_frame",
    beatKey: "scene_start_beat",
    isLength: false,
    meaning: "The first shown moment of the scene",
  },
  {
    frameKey: "asset_start_frame",
    beatKey: "asset_start_beat",
    isLength: false,
    meaning: "The first played moment of the asset",
  },
];

export function twinOfFrameKey(key: string): BeatTwin | undefined {
  return beatTwins.find((twin) => twin.frameKey === key);
}
