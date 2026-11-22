import { z } from "zod";

export const stepsLimits = { heading: 100, step: 80, steps: 5 } as const;

export const stepsItem = z
  .string()
  .min(1)
  .max(stepsLimits.step)
  .describe("One step. A short phrase of 2 to 5 words reads best.");

export const stepsSchema = {
  purpose:
    "2 to 5 numbered steps that come in one after another, with a line that draws from each step to the next. A row in a wide picture and a column in a tall one. For how it works in a few steps.",
  props: z.strictObject({
    heading: z
      .string()
      .max(stepsLimits.heading)
      .optional()
      .describe("An optional heading above the steps."),
    steps: z
      .array(stepsItem)
      .min(2)
      .max(stepsLimits.steps)
      .describe("The steps in order, 2 to 5 steps."),
  }),
};
