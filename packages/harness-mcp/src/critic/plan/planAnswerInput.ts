import { shotDifficultyRange, sheetVerdicts } from "@yumekit/project";
import { z } from "zod";
import { checkAnswerInput } from "../clip/clipAnswerInput.js";

const texts = z.array(z.string().trim().min(1));

export const planAnswerInput = {
  checks: z
    .array(checkAnswerInput)
    .describe("One answer for each item of the list."),
  findings: z
    .array(
      z.strictObject({
        index: z.int().min(1).describe("The number of the finding."),
        cause: z
          .enum(["fault", "harmless"])
          .describe("A real fault of the plan, or harmless."),
        seen: z.string().trim().min(1).describe("Why, in plain words."),
      }),
    )
    .describe("One answer for each finding of the word test."),
  shots: z
    .array(
      z.strictObject({
        shot_id: z.string().trim().min(1),
        difficulty: z
          .int()
          .min(shotDifficultyRange.minimum)
          .max(shotDifficultyRange.maximum)
          .describe("1 easy for the models, 5 likely to fail."),
        limits: z
          .array(z.string().trim().min(1))
          .describe("The ids of the known limits that the shot touches."),
        faults: texts.describe(
          "Blocking faults: what will likely fail and must change before any money.",
        ),
        notes: texts.describe("Notes: worth a look, but they do not refuse."),
      }),
    )
    .describe("One entry for each shot of the plan."),
  cast: z
    .array(
      z.strictObject({
        cast_id: z.string().trim().min(1),
        faults: texts.describe(
          "Blocking faults of the facts or the sheet prompts.",
        ),
        notes: texts,
      }),
    )
    .describe("One entry for each cast entry of the plan."),
  faults: texts.describe("Blocking faults of the whole plan."),
  notes: texts.describe("Notes about the whole plan."),
  verdict: z
    .enum(sheetVerdicts)
    .describe("pass (the money can start) or fail (with blocking faults)."),
  easiest_shot_id: z.string().trim().min(1),
  hardest_shot_id: z.string().trim().min(1),
};

export type PlanAnswer = z.output<z.ZodObject<typeof planAnswerInput>>;
