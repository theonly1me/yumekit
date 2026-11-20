import { z } from "zod";

export const titleCardLimits = { heading: 160, subheading: 200 } as const;

export const titleCardSchema = {
  purpose:
    "An opening or section title: one large heading, an optional smaller line under it, and one accent shape that grows in.",
  props: z.strictObject({
    heading: z
      .string()
      .min(1)
      .max(titleCardLimits.heading)
      .describe(
        "The title text. Under 40 characters reads best. Longer text wraps and gets smaller to fit.",
      ),
    subheading: z
      .string()
      .max(titleCardLimits.subheading)
      .optional()
      .describe(
        "An optional short line under the title, for example a date or a one-line promise.",
      ),
  }),
};
