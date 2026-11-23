import { z } from "zod";

export const linesLimits = { line: 60, lines: 4 } as const;

export const linesLine = z
  .string()
  .min(1)
  .max(linesLimits.line)
  .describe("One short line, 1 to 4 words.");

export const linesSchema = {
  purpose:
    "1 to 4 short lines under each other, one on each beat, each as large as the width allows. A new line dims the lines before it. For a claim in a few words.",
  props: z.strictObject({
    lines: z
      .array(linesLine)
      .min(1)
      .max(linesLimits.lines)
      .describe("The lines in order."),
    accentLine: z
      .int()
      .min(1)
      .max(linesLimits.lines)
      .optional()
      .describe(
        "The number of the line, from 1, to draw in the accent color. Leave it out for no accent.",
      ),
  }),
};
