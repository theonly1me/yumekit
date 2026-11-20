import { z } from "zod";

export const barChartLimits = {
  heading: 120,
  label: 60,
  bars: 8,
  affix: 8,
} as const;

export const barChartBar = z
  .strictObject({
    label: z
      .string()
      .min(1)
      .max(barChartLimits.label)
      .describe("The name of the bar, shown above it."),
    value: z
      .number()
      .describe(
        "The number of the bar. Bars are sized relative to the largest value. A negative value draws an empty bar.",
      ),
  })
  .describe("One bar with a label and a value.");

export const barChartSchema = {
  purpose:
    "A heading and 1 to 8 horizontal bars that grow one after another, each with a label and a value, to compare numbers.",
  props: z.strictObject({
    heading: z
      .string()
      .max(barChartLimits.heading)
      .optional()
      .describe("An optional heading above the bars."),
    bars: z
      .array(barChartBar)
      .min(1)
      .max(barChartLimits.bars)
      .describe("The bars from top to bottom, 1 to 8 bars."),
    valuePrefix: z
      .string()
      .max(barChartLimits.affix)
      .optional()
      .describe("Text before each value, for example $."),
    valueSuffix: z
      .string()
      .max(barChartLimits.affix)
      .optional()
      .describe(
        'Text after each value, for example % or " hours" with a leading space.',
      ),
  }),
};
