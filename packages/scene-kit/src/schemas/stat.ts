import { z } from "zod";

export const statLimits = { prefix: 8, suffix: 12, label: 120 } as const;

export const statSchema = {
  purpose:
    "One large number that counts up and lands with a pulse, with a unit and one line that says what it means. Use one scene for each number.",
  props: z.strictObject({
    value: z
      .number()
      .describe(
        "The number, for example 3, 98.5, or 1200000. It counts up from 0 and keeps the decimals of this value.",
      ),
    prefix: z
      .string()
      .max(statLimits.prefix)
      .optional()
      .describe("Text before the number, for example $.")
      .meta({ title: "Before the number" }),
    suffix: z
      .string()
      .max(statLimits.suffix)
      .optional()
      .describe(
        'Text after the number, for example %, x, or " hours" with a leading space.',
      )
      .meta({ title: "After the number" }),
    label: z
      .string()
      .max(statLimits.label)
      .optional()
      .describe(
        "One line that says what the number means. Under 60 characters reads best.",
      ),
  }),
};
