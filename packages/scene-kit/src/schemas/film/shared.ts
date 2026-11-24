import { z } from "zod";

export const filmLimits = { heading: 80, label: 40, markName: 60 } as const;

const share = z.number().min(0).max(1);

const filmRegionLine =
  "A part of the picture, as shares of its width and height from 0 to 1. The scene shows at least this part, as large as the space allows.";

const filmMarkLine =
  "The name of a mark of the asset (import_asset or mark_asset). Its region and its time replace region and startSeconds.";

export const filmRegion = z
  .strictObject({
    x: share.describe("The left edge, from 0 (left) to 1 (right)."),
    y: share.describe("The top edge, from 0 (top) to 1 (bottom)."),
    width: z
      .number()
      .gt(0)
      .max(1)
      .describe("The width as a share of the picture width."),
    height: z
      .number()
      .gt(0)
      .max(1)
      .describe("The height as a share of the picture height."),
  })
  .describe(filmRegionLine);

export function optionalRegion() {
  return filmRegion
    .optional()
    .describe(filmRegionLine)
    .meta({ title: "Part of the picture" });
}

export function optionalMark() {
  return filmMarkName
    .optional()
    .describe(filmMarkLine)
    .meta({ title: "Named part" });
}

export const filmHeading = z
  .string()
  .min(1)
  .max(filmLimits.heading)
  .optional()
  .describe(
    "An optional short headline, 1 to 6 words. Each film scene draws it in the same place and size, so a cut between two of them reads as one film.",
  );

export const filmAccent = z
  .string()
  .min(1)
  .max(filmLimits.heading)
  .optional()
  .describe(
    'An optional part of the heading to draw in the accent color, for example "Every platform." of "One idea. Every platform.". Use the accent in one or two scenes of a film, not in each.',
  );

export const filmMarkName = z
  .string()
  .min(1)
  .max(filmLimits.markName)
  .describe(filmMarkLine);

export const filmStartSeconds = z
  .number()
  .min(0)
  .optional()
  .describe(
    "The second of each video that frame 0 of the scene shows. The default is 0.",
  )
  .meta({ title: "Start at second" });

export const filmLabels = (count: number) =>
  z
    .array(z.string().max(filmLimits.label).describe("One short label."))
    .max(count)
    .optional()
    .describe(
      "Optional short labels in the order of assetIds, one under each picture, for example YouTube 16:9.",
    );
