import type { Chapter, StoryPlan } from "../format/storyPlan.js";

export const filmChapterId = "film";

export const filmChapterTitle = "The whole film";

export type ChapterPlan = Pick<StoryPlan, "shots" | "chapters">;

export function chaptersOf(plan: ChapterPlan | undefined): Chapter[] {
  if (plan?.chapters !== undefined) return plan.chapters;
  return [
    {
      id: filmChapterId,
      title: filmChapterTitle,
      shotIds: (plan?.shots ?? []).map((shot) => shot.id),
    },
  ];
}

export function chapterIdOfShot(options: {
  plan: ChapterPlan | undefined;
  shotId: string;
}): string | undefined {
  return chaptersOf(options.plan).find((chapter) =>
    chapter.shotIds.includes(options.shotId),
  )?.id;
}
