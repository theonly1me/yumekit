import { chaptersOf, type ProjectSnapshot } from "@yumekit/project";
import { z } from "zod";

const chaptersInputSchema = z.looseObject({
  chapters: z.array(
    z.looseObject({
      chapter_id: z.string(),
      title: z.string(),
      shot_ids: z.array(z.string()),
    }),
  ),
});

interface ChapterFacts {
  id: string;
  title: string;
  shotIds: string[];
}

function shotsOf(chapter: ChapterFacts | undefined): string {
  return chapter?.shotIds.join(" ") ?? "";
}

function movedChapterOf(options: {
  before: ChapterFacts[];
  after: ChapterFacts[];
}): ChapterFacts | undefined {
  const { before, after } = options;
  const distanceOf = (chapter: ChapterFacts) =>
    Math.abs(
      before.findIndex((each) => each.id === chapter.id) -
        after.findIndex((each) => each.id === chapter.id),
    );
  return after.toSorted(
    (...[first, second]) => distanceOf(second) - distanceOf(first),
  )[0];
}

function sentenceOf(options: {
  before: ChapterFacts[];
  after: ChapterFacts[];
}): string {
  const { before, after } = options;
  const flat = (list: ChapterFacts[]) => list.map(shotsOf).join(" ");
  const sameShots = flat(before) === flat(after);
  const changedAt = before.findIndex(
    (...[chapter, index]) =>
      after[index]?.id !== chapter.id ||
      shotsOf(after[index]) !== shotsOf(chapter),
  );
  const number = String(changedAt + 1);
  const next = String(changedAt + 2);
  if (sameShots && after.length === before.length + 1) {
    return `You split chapter ${number}.`;
  }
  if (sameShots && after.length === before.length - 1) {
    return `You joined chapter ${number} and chapter ${next}.`;
  }
  if (sameShots && changedAt === -1) {
    const renamed = after.findIndex(
      (...[chapter, index]) => chapter.title !== before[index]?.title,
    );
    const title = after[renamed]?.title ?? "";
    return `You renamed chapter ${String(renamed + 1)} to "${title}".`;
  }
  if (sameShots) {
    return `You moved the line between chapter ${number} and chapter ${next}.`;
  }
  const keepsEachChapter =
    after.length === before.length &&
    after.every(
      (chapter) =>
        shotsOf(before.find((each) => each.id === chapter.id)) ===
        shotsOf(chapter),
    );
  const moved = movedChapterOf(options);
  if (keepsEachChapter && moved !== undefined) {
    return `You moved the chapter "${moved.title}".`;
  }
  return "You moved a scene to another chapter.";
}

export function chapterSentenceOf(options: {
  tool: string;
  input: Readonly<Record<string, unknown>>;
  snapshot: ProjectSnapshot;
}): string | undefined {
  if (options.tool !== "set_chapters") return undefined;
  const parsed = chaptersInputSchema.safeParse(options.input);
  if (!parsed.success) return undefined;
  return sentenceOf({
    before: chaptersOf(options.snapshot.bible.storyPlan),
    after: parsed.data.chapters.map((chapter) => ({
      id: chapter.chapter_id,
      title: chapter.title,
      shotIds: chapter.shot_ids,
    })),
  });
}
