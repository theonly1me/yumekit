import { z } from "zod";

export const compareLimits = { title: 40, row: 80, rows: 5 } as const;

const sideText = z.string().min(1).max(compareLimits.row);

export const compareRow = z
  .strictObject({
    left: sideText.describe("The text of the row on the left side."),
    right: sideText.describe("The text of the row on the right side."),
  })
  .describe("One row with a text for each side.");

export const compareSchema = {
  purpose:
    'Two columns side by side (stacked in a tall picture), each with a title and the same rows, for "before and after" or "the old way and the new way". The left side comes in first and dims. The right side wins with the accent.',
  props: z.strictObject({
    left: z
      .string()
      .min(1)
      .max(compareLimits.title)
      .describe("The title of the left side, the old way. For example Before."),
    right: z
      .string()
      .min(1)
      .max(compareLimits.title)
      .describe(
        "The title of the right side, the new way. For example After, or the product name.",
      ),
    rows: z
      .array(compareRow)
      .min(1)
      .max(compareLimits.rows)
      .describe(
        "1 to 5 rows from top to bottom. Each row compares one point. 2 to 5 words on each side read best.",
      ),
  }),
};
