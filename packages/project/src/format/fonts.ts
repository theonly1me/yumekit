import { z } from "zod";
import { idSchema } from "./values.js";

export const fontStyles = ["normal", "italic"] as const;

const fontWeightSchema = z.int().min(1).max(1000);

export const projectFontSchema = z.strictObject({
  assetId: idSchema,
  family: z
    .string()
    .regex(
      /^[A-Za-z0-9][A-Za-z0-9 -]{0,63}$/,
      "must be 1 to 64 letters, digits, spaces, or hyphens",
    ),
  weight: z
    .union([fontWeightSchema, z.tuple([fontWeightSchema, fontWeightSchema])])
    .exactOptional(),
  style: z.enum(fontStyles).exactOptional(),
});

export type ProjectFont = z.infer<typeof projectFontSchema>;

export const sharedCodeNameSchema = idSchema;
