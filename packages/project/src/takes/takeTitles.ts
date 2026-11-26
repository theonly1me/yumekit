import type { TakeStep } from "../format/takes.js";

export interface TitledTake {
  step: TakeStep;
  number: number;
  chapterId?: string | undefined;
}

const stepNouns: Record<TakeStep, string> = {
  story: "the story",
  pictures: "the pictures",
  clips: "the clips",
  cut: "the cut",
};

export function takeTitleOf(options: {
  take: TitledTake;
  chapters: readonly { id: string }[];
}): string {
  const { take, chapters } = options;
  if (take.step === "story") return "The story";
  const index = chapters.findIndex((chapter) => chapter.id === take.chapterId);
  const chapter =
    chapters.length > 1 && index !== -1
      ? ` in chapter ${String(index + 1)}`
      : "";
  return `Take ${String(take.number)} of ${stepNouns[take.step]}${chapter}`;
}

const nextWork: Record<TakeStep, string> = {
  story: "pictures",
  pictures: "clips",
  clips: "cuts",
  cut: "pictures",
};

export function nextWorkOf(step: TakeStep): string {
  return nextWork[step];
}

export function takeTitleInTextOf(
  options: Parameters<typeof takeTitleOf>[0],
): string {
  const title = takeTitleOf(options);
  return `${title.charAt(0).toLowerCase()}${title.slice(1)}`;
}
