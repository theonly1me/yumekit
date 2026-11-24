import { z } from "zod";

const largestMarkCount = 32;
const roundingRoom = 0.0001;

const share = z.number().min(0).max(1);

export const assetRegionSchema = z
  .strictObject({
    x: share,
    y: share,
    width: z.number().gt(0).max(1),
    height: z.number().gt(0).max(1),
  })
  .refine(
    (region) =>
      region.x + region.width <= 1 + roundingRoom &&
      region.y + region.height <= 1 + roundingRoom,
    "must stay inside the picture: x + width and y + height are at most 1",
  );

export const assetMarkSchema = z
  .strictObject({
    name: z.string().trim().min(1).max(60),
    region: assetRegionSchema.exactOptional(),
    seconds: z.number().min(0).exactOptional(),
  })
  .refine(
    (mark) => mark.region !== undefined || mark.seconds !== undefined,
    "needs a region, a time in seconds, or both",
  );

export const assetMarksSchema = z
  .array(assetMarkSchema)
  .max(largestMarkCount)
  .refine(
    (marks) => new Set(marks.map((mark) => mark.name)).size === marks.length,
    "must have a different name for each mark",
  );

export type AssetRegion = z.infer<typeof assetRegionSchema>;
export type AssetMark = z.infer<typeof assetMarkSchema>;
