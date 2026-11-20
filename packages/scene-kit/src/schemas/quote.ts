import { z } from "zod";

export const quoteLimits = { quote: 300, source: 120 } as const;

export const quoteSchema = {
  purpose:
    "One sentence in large type that appears word by word, with an accent rule and an optional source line under it.",
  props: z.strictObject({
    quote: z
      .string()
      .min(1)
      .max(quoteLimits.quote)
      .describe(
        "The sentence to show. Under 12 words reads best. Do not add quotation marks.",
      ),
    source: z
      .string()
      .max(quoteLimits.source)
      .optional()
      .describe("An optional source line, for example the name of a person."),
  }),
};
