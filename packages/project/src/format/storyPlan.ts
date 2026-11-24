import { z } from "zod";
import { idSchema } from "./values.js";

export const shotSizes = [
  "wide",
  "full",
  "medium",
  "close-up",
  "extreme-close-up",
] as const;

export const shotAngles = ["eye-level", "low", "high", "overhead"] as const;

export const reviewVerdicts = ["keep", "cut", "redo"] as const;

export const shotSecondsRange = { minimum: 2, maximum: 10 } as const;

const motionMeasuresSchema = z.strictObject({
  motion: z.number().min(0),
  worldMotion: z.number().min(0),
  cameraMotion: z.number().min(0),
  startDifference: z.number().min(0).exactOptional(),
  warnings: z.array(z.string()),
});

export const clipReviewSchema = z.strictObject({
  assetId: idSchema,
  verdict: z.enum(reviewVerdicts),
  faults: z.array(z.string()),
  keepFromSeconds: z.number().min(0).exactOptional(),
  keepToSeconds: z.number().positive().exactOptional(),
  endPictureAssetId: idSchema.exactOptional(),
  measures: motionMeasuresSchema,
});

export const shotSchema = z.strictObject({
  id: idSchema,
  purpose: z.string(),
  action: z.string(),
  placeId: idSchema,
  castIds: z.array(idSchema),
  camera: z.strictObject({
    size: z.enum(shotSizes),
    angle: z.enum(shotAngles),
    move: idSchema.exactOptional(),
  }),
  seconds: z
    .number()
    .min(shotSecondsRange.minimum)
    .max(shotSecondsRange.maximum),
  startState: z.string(),
  endState: z.string(),
  inherits: z.string(),
  reviews: z.array(clipReviewSchema).exactOptional(),
});

export const storyPlanSchema = z.strictObject({
  logline: z.string(),
  want: z.string(),
  obstacle: z.string(),
  change: z.string(),
  shots: z.array(shotSchema),
});

export type ShotSize = (typeof shotSizes)[number];
export type ShotAngle = (typeof shotAngles)[number];
export type ReviewVerdict = (typeof reviewVerdicts)[number];
export type MotionMeasures = z.infer<typeof motionMeasuresSchema>;
export type ClipReview = z.infer<typeof clipReviewSchema>;
export type Shot = z.infer<typeof shotSchema>;
export type StoryPlan = z.infer<typeof storyPlanSchema>;
