import { z } from "zod";
import { designCheckSchema } from "./designCheck.js";
import { sheetReviewSchema } from "./reviews.js";
import { idSchema } from "./values.js";

export const defaultLookId = "default";

export const lookSheetKinds = [
  "turnaround",
  "expressions",
  "poses",
  "hands-props",
] as const;

export const lookLimits = {
  looks: 8,
  items: 24,
  characters: 200,
  sheets: 8,
  propCount: 20,
} as const;

const lookText = z.string().max(lookLimits.characters);

export const lookPropSchema = z.strictObject({
  name: lookText,
  count: z.int().min(0).max(lookLimits.propCount),
  side: lookText,
});

export const lookSheetSchema = z.strictObject({
  assetId: idSchema,
  kind: z.enum(lookSheetKinds),
  poses: z.array(lookText).max(lookLimits.items).exactOptional(),
  check: designCheckSchema.exactOptional(),
});

export const castLookSchema = z.strictObject({
  id: idSchema,
  name: z.string(),
  clothes: z.array(lookText).max(lookLimits.items),
  props: z.array(lookPropSchema).max(lookLimits.items),
  sheets: z.array(lookSheetSchema).max(lookLimits.sheets),
  personAsked: z.strictObject({ words: z.string().min(1) }).exactOptional(),
  sheetReview: sheetReviewSchema.exactOptional(),
});

export type LookSheetKind = (typeof lookSheetKinds)[number];
export type LookProp = z.infer<typeof lookPropSchema>;
export type LookSheet = z.infer<typeof lookSheetSchema>;
export type CastLook = z.infer<typeof castLookSchema>;
