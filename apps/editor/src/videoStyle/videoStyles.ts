export const videoStyleIds = ["graphics", "ai-video", "mix"] as const;

export type VideoStyleId = (typeof videoStyleIds)[number];

export interface VideoStyleChoice {
  id: VideoStyleId;
  name: string;
  line: string;
}

export const videoStyleChoices: readonly VideoStyleChoice[] = [
  {
    id: "graphics",
    name: "Graphics",
    line: "Each scene is drawn by code. It is exact, and it costs nothing.",
  },
  {
    id: "ai-video",
    name: "AI video",
    line: "Each scene is a video clip from a video model. It looks real, and it costs money.",
  },
  {
    id: "mix",
    name: "Mix",
    line: "The AI picks for each scene: graphics for words and numbers, a video clip for a real shot.",
  },
];

export function usesAiVideo(videoStyle: VideoStyleId): boolean {
  return videoStyle !== "graphics";
}

export function aiVideoLimitLineOf(limitSeconds: number | null): string {
  if (limitSeconds === null) {
    return "yumekit has a limit of AI video for each project. You can change this in Settings.";
  }
  if (limitSeconds === 0) {
    return "AI video is turned off in Settings, so yumekit draws each scene by code. You can change this in Settings.";
  }
  return `yumekit makes at most ${String(limitSeconds)} seconds of AI video for this project. You can change this in Settings.`;
}

export const backToGraphicsRequest =
  "Draw this scene by code, with no video clip.";
