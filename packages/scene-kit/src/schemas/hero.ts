import { z } from "zod";

export const heroLimits = { heading: 120, accentWord: 40, kicker: 60 } as const;

export const heroSchema = {
  purpose:
    "The opening of a launch video: a large headline that comes in word by word, one word or phrase in the accent color with a line drawn under it, and an optional short line above it.",
  props: z.strictObject({
    heading: z
      .string()
      .min(1)
      .max(heroLimits.heading)
      .describe(
        "The headline, 3 to 8 words. Under 40 characters reads best. Longer text wraps and gets smaller to fit.",
      ),
    accentWord: z
      .string()
      .max(heroLimits.accentWord)
      .optional()
      .describe(
        "A word or a short phrase of the heading, as it is written there, that gets the accent color and the drawn line. The default is the last word.",
      ),
    kicker: z
      .string()
      .max(heroLimits.kicker)
      .optional()
      .describe(
        "An optional short line above the headline, for example the product name or a date. It shows in capitals.",
      )
      .meta({ title: "Line above" }),
  }),
};
