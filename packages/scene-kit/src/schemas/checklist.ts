import { z } from "zod";

export const checklistLimits = { heading: 120, item: 100, items: 6 } as const;

export const checklistItem = z
  .string()
  .min(1)
  .max(checklistLimits.item)
  .describe("One item. A short phrase of 2 to 6 words reads best.");

export const checklistSchema = {
  purpose:
    "A heading and 1 to 6 items that each get a check mark one after another. For what a product does, what is included, or what is done.",
  props: z.strictObject({
    heading: z
      .string()
      .max(checklistLimits.heading)
      .optional()
      .describe("An optional heading beside or above the items."),
    items: z
      .array(checklistItem)
      .min(1)
      .max(checklistLimits.items)
      .describe("The items in order, 1 to 6 items."),
  }),
};
