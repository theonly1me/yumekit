import { z } from "zod";
import { platformIds } from "../platforms/catalog.js";
import { projectFontSchema, sharedCodeNameSchema } from "./fonts.js";
import { highestTempo, lowestTempo } from "../tempo/index.js";
import { lookColorsSchema, lookSchema } from "./look.js";
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

export const checkModes = ["draft", "critic"] as const;

export const checkModeSchema = z.enum(checkModes);

export const projectSchema = z.strictObject({
  formatVersion: z.literal(1),
  name: z.string(),
  framesPerSecond: z.literal([24, 25, 30, 50, 60]),
  outputs: z.array(outputSchema),
  videoStyle: videoStyleSchema.exactOptional(),
  checks: checkModeSchema.exactOptional(),
  approvePicturesFirst: z.boolean().exactOptional(),
  look: lookSchema.exactOptional(),
  calm: z.boolean().exactOptional(),
  tempo: z.number().min(lowestTempo).max(highestTempo).exactOptional(),
  fonts: z.array(projectFontSchema).min(1).exactOptional(),
  frame: sharedCodeNameSchema.exactOptional(),
  lookColors: lookColorsSchema.exactOptional(),
  lookFont: projectFontSchema.shape.family.exactOptional(),
});

export type Output = z.infer<typeof outputSchema>;
export type Project = z.infer<typeof projectSchema>;
export type VideoStyle = z.infer<typeof videoStyleSchema>;
export type CheckMode = z.infer<typeof checkModeSchema>;

export function videoStyleOf(project: Project): VideoStyle {
  return project.videoStyle ?? "graphics";
}

export function checkModeOf(project: Project): CheckMode {
  return project.checks ?? "draft";
}

export function approvePicturesFirstOf(project: Project): boolean {
  return project.approvePicturesFirst ?? true;
}
