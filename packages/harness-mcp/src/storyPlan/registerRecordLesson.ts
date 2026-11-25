import { z } from "zod";
import { applyEditsResult } from "../applyEditsResult.js";
import type { HarnessContext } from "../context.js";
import { failureResult } from "../results.js";
import {
  lessonLinesOf,
  lessonRecordsOf,
  lessonsNotSentLine,
} from "./lessonsForYou.js";

const recordLessonInput = {
  lesson: z
    .string()
    .trim()
    .min(1)
    .max(400)
    .describe(
      "The form that works, in words for a prompt, for example 'frame a contact so the target fills half of the frame, and make the contact the only motion'.",
    ),
  cause: z
    .string()
    .trim()
    .min(1)
    .max(400)
    .describe(
      "What failed and why, for example 'the sandal missed the small puddle'.",
    ),
  shot_id: z.string().optional().describe("The shot whose refusal taught it."),
  cast_id: z
    .string()
    .optional()
    .describe("The cast entry whose refused sheet taught it."),
  is_limit: z
    .boolean()
    .optional()
    .describe(
      "true when the same cause refused a sheet or a clip twice: a limit of the models that the story guide and the plan check of this film use.",
    ),
};

export function registerRecordLesson(context: HarnessContext): void {
  context.tools.add({
    name: "record_lesson",
    description:
      "Record what a refused sheet or clip taught: its cause and the form that works. A lesson is for you, not for a model: yumekit never adds it to a prompt. The answer, get_work, and each later picture or clip call of a shot list the lessons, and you write what applies into your own prompt. After the calibration shots, each refused one needs a lesson before another shot. With is_limit true, it is also a known limit of the models for this film.",
    inputSchema: recordLessonInput,
    run: ({ input }) => {
      const { bible } = context.store.read();
      const plan = bible.storyPlan;
      if (plan === undefined) {
        return failureResult({
          kind: "story-plan-missing",
          message:
            "A lesson belongs to the story plan, and this project has none.",
          hint: "Write the plan with set_story_plan first.",
        });
      }
      if (
        input.shot_id !== undefined &&
        !plan.shots.some((shot) => shot.id === input.shot_id)
      ) {
        return failureResult({
          kind: "shot-not-found",
          message: `The story plan has no shot "${input.shot_id}".`,
          hint: `Use one of: ${plan.shots.map((shot) => shot.id).join(", ")}.`,
        });
      }
      if (
        input.cast_id !== undefined &&
        !bible.cast.some((member) => member.id === input.cast_id)
      ) {
        return failureResult({
          kind: "cast-member-not-found",
          message: `The cast has no entry "${input.cast_id}".`,
          hint: `Use one of: ${bible.cast.map((member) => member.id).join(", ") || "none"}.`,
        });
      }
      const lesson = {
        text: input.lesson,
        cause: input.cause,
        ...(input.shot_id === undefined ? {} : { shotId: input.shot_id }),
        ...(input.cast_id === undefined ? {} : { castId: input.cast_id }),
        isLimit: input.is_limit ?? false,
      };
      const lessons = [...(plan.lessons ?? []), lesson];
      return applyEditsResult({
        store: context.store,
        edits: [
          {
            kind: "setBible",
            bible: { ...bible, storyPlan: { ...plan, lessons } },
          },
        ],
        line: [
          `Lesson ${String(lessons.length)} saved.${lesson.isLimit ? " It is also a known limit of this film." : ""} ${lessonsNotSentLine}`,
          "Lessons of this film:",
          ...lessonLinesOf(lessons),
        ].join("\n"),
        data: {
          lessons: lessons.length,
          lessons_for_you: lessonRecordsOf(lessons),
        },
      });
    },
  });
}
