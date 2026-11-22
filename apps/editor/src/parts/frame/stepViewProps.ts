import type { SoundViewProps } from "../sound/soundView.js";

export type StepViewId = "script" | "pictures" | "voice" | "music";

export type StepViewProps = SoundViewProps;

export const stepViewTitles: Record<StepViewId, string> = {
  script: "The script",
  pictures: "The pictures",
  voice: "The voice",
  music: "The music",
};

export const notSentText = "The request did not start. Try again in a moment.";
