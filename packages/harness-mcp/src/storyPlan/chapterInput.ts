import type { Chapter, StoryPlan } from "@yumekit/project";
import { z } from "zod";
import { idInput } from "../inputs.js";

export const chapterInput = z.object({
  chapter_id: idInput("The id of the chapter, for example 'the-harbor'."),
  title: z
    .string()
    .trim()
    .min(1)
    .max(80)
    .describe("The title of the chapter for the person."),
  shot_ids: z
    .array(idInput("A shot id of the plan."))
    .min(1)
    .describe("The shots of the chapter, in film order."),
});

export const chaptersInput = z
  .array(chapterInput)
  .min(1)
  .max(40)
  .optional()
  .describe(
    "The chapters of a film that is too long to make at once, about 1 to 3 minutes each. Each shot is in exactly one chapter, and the chapters keep the order of the shots. Leave it out to keep the chapters as they are: a new shot joins the chapter of the shot before it. A plan with no chapters is one chapter.",
  );

export type ChaptersInput = z.infer<typeof chaptersInput>;

function fittedChapters(options: {
  earlier: Chapter[];
  shotIds: string[];
}): Chapter[] {
  const { earlier } = options;
  const chapterOfShot = new Map(
    earlier.flatMap((chapter) =>
      chapter.shotIds.map((shotId) => [shotId, chapter.id] as const),
    ),
  );
  let current = earlier[0]?.id;
  const placed = options.shotIds.map((shotId) => {
    current = chapterOfShot.get(shotId) ?? current;
    return { shotId, chapterId: current };
  });
  return earlier
    .map((chapter) => ({
      ...chapter,
      shotIds: placed
        .filter((entry) => entry.chapterId === chapter.id)
        .map((entry) => entry.shotId),
    }))
    .filter((chapter) => chapter.shotIds.length > 0);
}

export function chaptersOfInput(options: {
  input: ChaptersInput;
  earlier: StoryPlan | undefined;
  shotIds: string[];
}): Chapter[] | undefined {
  const { input } = options;
  if (input !== undefined) {
    return input.map((chapter) => ({
      id: chapter.chapter_id,
      title: chapter.title,
      shotIds: chapter.shot_ids,
    }));
  }
  const earlier = options.earlier?.chapters;
  return earlier === undefined
    ? undefined
    : fittedChapters({ earlier, shotIds: options.shotIds });
}
