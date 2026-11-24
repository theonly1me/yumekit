import { reviewVerdicts } from "@yumekit/project";
import { z } from "zod";

const seenText = z
  .string()
  .trim()
  .min(1)
  .describe("What you saw on the frames, in plain words.");

const secondsInput = z
  .number()
  .min(0)
  .optional()
  .describe("The time in the clip, in seconds.");

export const countInput = z.strictObject({
  object: z
    .string()
    .trim()
    .min(1)
    .describe("What you counted, for example 'swords', 'masks', 'bodies'."),
  expected: z
    .int()
    .min(0)
    .describe(
      "How many the facts and the plan give inside the frame. A hand that the camera does not show is not expected.",
    ),
  seen: z.int().min(0).describe("The most you saw at one time on the frames."),
  seconds: secondsInput.describe(
    "When the count differs. Needed when seen is not expected.",
  ),
});

export const checkAnswerInput = z.strictObject({
  item: z.int().min(1).describe("The number of the item of the list."),
  seen: seenText,
});

const happenedInput = z.strictObject({
  happened: z.boolean(),
  seconds: secondsInput.describe("When it happened or should have happened."),
  seen: seenText,
});

export const clipAnswerInput = {
  checks: z
    .array(checkAnswerInput)
    .describe("One answer for each item of the list, with times."),
  counts: z
    .array(countInput)
    .describe(
      "A count for each object that the facts count: swords, hands, fingers, masks, eyes, bodies, heads.",
    ),
  action: happenedInput.describe("Did the planned action happen and complete?"),
  end_entries: z
    .array(
      happenedInput.extend({
        entry: z
          .string()
          .trim()
          .min(1)
          .describe(
            "The cast id of the end entry, or 'end state' for a plan in words.",
          ),
      }),
    )
    .describe("For each end entry of the shot: did it happen?"),
  start_match: z
    .strictObject({ matches: z.boolean(), seen: seenText })
    .describe("Does the first frame match the start picture?"),
  cut_match: z
    .strictObject({ matches: z.boolean(), seen: seenText })
    .optional()
    .describe(
      "Does the start match the end picture of the shot before: the same place, screen side, and facing? Needed when there is one.",
    ),
  warnings: z
    .array(
      z.strictObject({
        index: z.int().min(1).describe("The number of the measured warning."),
        cause: z
          .enum(["fault", "harmless"])
          .describe("A real fault, or a harmless cause."),
        seen: seenText.describe(
          "What is on the frames at that time: the fault, or the harmless cause by name (a drawn flash, a planned cut).",
        ),
      }),
    )
    .describe("One answer for each measured warning."),
  verdict: z
    .enum(reviewVerdicts)
    .describe(
      "keep (the whole clip passes), cut (only a clean part passes), or redo.",
    ),
  keep_from_seconds: z
    .number()
    .min(0)
    .optional()
    .describe("With cut: where the clean part starts."),
  keep_to_seconds: z
    .number()
    .positive()
    .optional()
    .describe("With cut: where the clean part ends."),
  faults: z
    .array(z.string().trim().min(1))
    .describe(
      "Each BLOCKING fault in plain words with its time: the film cannot use this part. Empty only for keep.",
    ),
  notes: z
    .array(z.string().trim().min(1))
    .default([])
    .describe(
      "Each difference that a viewer would not see, with its time. Notes do not refuse the clip.",
    ),
};

export type ClipAnswer = z.output<z.ZodObject<typeof clipAnswerInput>>;
