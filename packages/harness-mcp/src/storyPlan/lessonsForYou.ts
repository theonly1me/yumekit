import type { Lesson, ProjectSnapshot } from "@yumekit/project";
import type { GenerateAssetInput } from "../media/generateAssetInput.js";

export const lessonsNotSentLine =
  "yumekit sends no lesson to a picture or video model. Write what applies into your own prompts.";

export function lessonRecordsOf(lessons: Lesson[]) {
  return lessons.map((lesson) => ({
    lesson: lesson.text,
    cause: lesson.cause,
    ...(lesson.shotId === undefined ? {} : { shot_id: lesson.shotId }),
    ...(lesson.castId === undefined ? {} : { cast_id: lesson.castId }),
    is_limit: lesson.isLimit,
  }));
}

export function lessonLinesOf(lessons: Lesson[]): string[] {
  return lessons.map((...[lesson, index]) => {
    const origin =
      lesson.shotId === undefined
        ? lesson.castId === undefined
          ? ""
          : ` (from the sheet of ${lesson.castId})`
        : ` (from shot ${lesson.shotId})`;
    return `${String(index + 1)}. ${lesson.text}${origin}`;
  });
}

export function lessonsForYouOf(options: {
  snapshot: ProjectSnapshot;
  request: GenerateAssetInput;
}): { lines: string[]; data: Record<string, unknown> } | undefined {
  const { request } = options;
  const lessons = options.snapshot.bible.storyPlan?.lessons ?? [];
  const isPictureOrClip =
    request.capability === "image" || request.capability === "video";
  if (!isPictureOrClip || request.shot_id === undefined) return undefined;
  if (lessons.length === 0) return undefined;
  return {
    lines: [
      `Lessons of this film, for you: ${lessonsNotSentLine}`,
      ...lessonLinesOf(lessons),
    ],
    data: { lessons_for_you: lessonRecordsOf(lessons) },
  };
}
