import { z } from "zod";

export const bulletListLimits = { heading: 120, item: 160, items: 6 } as const;

export const bulletListItem = z
  .string()
  .min(1)
  .max(bulletListLimits.item)
  .describe("One point. A short phrase of 2 to 6 words reads best.");

export const bulletListSchema = {
  purpose:
    "A heading and 1 to 6 short points that appear one after another, for lists, steps, or key facts.",
  props: z.strictObject({
    heading: z
      .string()
      .max(bulletListLimits.heading)
      .optional()
      .describe("An optional heading above the points."),
    items: z
      .array(bulletListItem)
      .min(1)
      .max(bulletListLimits.items)
      .describe(
        "The points in the order they appear, 1 to 6 items. Each item appears about 0.7 seconds after the previous one.",
      ),
  }),
};
