import type { SoundViewProps } from "../sound/soundView.js";

export type StepViewId =
  "story" | "script" | "pictures" | "voice" | "music" | "files";

export type StepViewProps = SoundViewProps;

export const stepViewTitles: Record<StepViewId, string> = {
  story: "The story",
  script: "The script",
  pictures: "The pictures",
  voice: "The voice",
  music: "The music",
  files: "The files",
};

export const notSentText = "The request did not start. Try again in a moment.";
