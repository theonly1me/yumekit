import { z } from "zod";
import { idSchema } from "./values.js";

const pixelSizeSchema = z
  .int()
  .min(16)
  .max(7680)
  .multipleOf(2, "must be an even number");

export const outputSchema = z.strictObject({
  id: idSchema,
  label: z.string(),
  widthPixels: pixelSizeSchema,
  heightPixels: pixelSizeSchema,
});

export const projectSchema = z.strictObject({
  formatVersion: z.literal(1),
  name: z.string(),
  framesPerSecond: z.literal([24, 25, 30, 50, 60]),
  outputs: z.array(outputSchema),
});

export type Output = z.infer<typeof outputSchema>;
export type Project = z.infer<typeof projectSchema>;
