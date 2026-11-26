import type { VideoStyleId } from "../videoStyle/videoStyles.js";

export type StartForm = "trailer" | "short" | "explainer";

export interface StartTemplate {
  id: StartForm;
  name: string;
  videoStyle: VideoStyleId;
  guide: string;
}

export const startTemplates: readonly StartTemplate[] = [
  {
    id: "trailer",
    name: "A trailer",
    videoStyle: "ai-video",
    guide:
      "A trailer, about 60 seconds.\nThe story: \nThe main characters: \nThe look: \nWhat it must show: \nThe words on screen: ",
  },
  {
    id: "short",
    name: "A movie",
    videoStyle: "ai-video",
    guide:
      "A movie, about 8 minutes.\nThe story: \nThe main characters: \nThe look: \nHow it ends: \nWhat it must show: ",
  },
  {
    id: "explainer",
    name: "A video",
    videoStyle: "mix",
    guide:
      "A video, about 60 seconds.\nWhat it is about: \nWho it is for: \nThe voice and the music: \nWhat it must show: ",
  },
];

export const howToLine =
  "Tell the lead as much as you can. It asks you questions, then writes the whole story for you to approve.";

export const noTemplateVideoStyle: VideoStyleId = "mix";

export function isGuideText(text: string): boolean {
  return (
    text.trim() === "" ||
    startTemplates.some((template) => template.guide === text)
  );
}

export function firstGapOf(guide: string): number {
  const gap = guide.indexOf(": \n");
  return gap === -1 ? guide.length : gap + 2;
}
