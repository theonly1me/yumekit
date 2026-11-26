import type { Take, TakeStep } from "@yumekit/project/takes";

export type ChapterStep = TakeStep | "done";

export const chapterStepLabels: Record<ChapterStep, string> = {
  story: "Story",
  pictures: "Pictures",
  clips: "Clips",
  cut: "Cut",
  done: "Done",
};

const stepAfter: Record<TakeStep, ChapterStep> = {
  story: "pictures",
  pictures: "clips",
  clips: "cut",
  cut: "done",
};

export function chapterStepOf(options: {
  takes: readonly Take[];
  chapterId: string;
}): ChapterStep {
  const newest = options.takes
    .filter((take) => take.chapterId === options.chapterId)
    .toSorted((...[first, second]) => first.number - second.number)
    .at(-1);
  if (newest === undefined) return "story";
  const isApproved = newest.state === "sent" && newest.notes.length === 0;
  return isApproved ? stepAfter[newest.step] : newest.step;
}
