import { z } from "zod";
import { filmAccent, filmHeading } from "./shared.js";

export const countsLimits = { items: 3, label: 40, affix: 8 } as const;

export const countsItem = z
  .strictObject({
    value: z.number().describe("The number that the count ends on."),
    label: z
      .string()
      .min(1)
      .max(countsLimits.label)
      .describe("What the number counts, in 1 to 4 words."),
    prefix: z
      .string()
      .max(countsLimits.affix)
      .optional()
      .describe("Text before the number, for example $."),
    suffix: z
      .string()
      .max(countsLimits.affix)
      .optional()
      .describe("Text after the number, for example %."),
  })
  .describe("One number with its label.");

export const countsSchema = {
  purpose:
    "1 to 3 numbers that count up on the beat, each with its label, and an optional headline. For a few facts in numbers.",
  props: z.strictObject({
    heading: filmHeading,
    accent: filmAccent,
    items: z
      .array(countsItem)
      .min(1)
      .max(countsLimits.items)
      .describe("The numbers in order."),
  }),
};
