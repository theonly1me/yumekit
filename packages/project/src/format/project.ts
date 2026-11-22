import { z } from "zod";
import { platformIds } from "../platforms/catalog.js";
import { lookSchema } from "./look.js";
import { idSchema } from "./values.js";

export const platformIdSchema = z.enum(platformIds);

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
  platforms: z.array(platformIdSchema).exactOptional(),
});

export const videoStyles = ["graphics", "ai-video", "mix"] as const;

export const videoStyleSchema = z.enum(videoStyles);

export const projectSchema = z.strictObject({
  formatVersion: z.literal(1),
  name: z.string(),
  framesPerSecond: z.literal([24, 25, 30, 50, 60]),
  outputs: z.array(outputSchema),
  videoStyle: videoStyleSchema.exactOptional(),
  look: lookSchema.exactOptional(),
});

export type Output = z.infer<typeof outputSchema>;
export type Project = z.infer<typeof projectSchema>;
export type VideoStyle = z.infer<typeof videoStyleSchema>;

export function videoStyleOf(project: Project): VideoStyle {
  return project.videoStyle ?? "graphics";
}
