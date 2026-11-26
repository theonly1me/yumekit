import { filmChapterId, filmChapterTitle } from "@yumekit/project/takes";
import type { StoryPlan } from "../../parts/story/storyPlanSchema.js";
import type { Chapter, Take, TakeStep } from "./takeSchema.js";

export type Verdict = "approved" | "change" | "dropped";

export function chaptersOf(plan: StoryPlan | undefined): Chapter[] {
  if (plan?.chapters !== undefined && plan.chapters.length > 0) {
    return plan.chapters;
  }
  return [
    {
      id: filmChapterId,
      title: filmChapterTitle,
      shotIds: (plan?.shots ?? []).map((shot) => shot.id),
    },
  ];
}

export function sentInOrder(takes: readonly Take[]): Take[] {
  return takes
    .filter((take) => take.state === "sent")
    .toSorted((...[first, second]) =>
      (first.sentAt ?? "").localeCompare(second.sentAt ?? ""),
    );
}

export function verdictsOf(takes: readonly Take[]): Map<string, Verdict> {
  const verdicts = new Map<string, Verdict>();
  for (const take of sentInOrder(takes)) {
    for (const item of take.items) {
      if (item.approved === true) verdicts.set(item.id, "approved");
    }
    for (const note of take.notes) {
      verdicts.set(note.itemId, note.dropped === true ? "dropped" : "change");
    }
  }
  return verdicts;
}

export function takesOfStep(options: {
  takes: readonly Take[];
  chapterId: string | undefined;
  step: TakeStep;
}): Take[] {
  return options.takes
    .filter(
      (take) =>
        take.step === options.step &&
        (take.step === "story" || take.chapterId === options.chapterId),
    )
    .toSorted((...[first, second]) => first.number - second.number);
}

export function takesOfChapter(options: {
  takes: readonly Take[];
  chapterId: string;
}): Take[] {
  return options.takes
    .filter((take) => take.chapterId === options.chapterId)
    .toSorted((...[first, second]) => first.number - second.number);
}
