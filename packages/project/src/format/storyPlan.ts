import { z } from "zod";
import { lessonSchema, planReviewSchema } from "./planReview.js";
import { clipReviewSchema, startReviewSchema } from "./reviews.js";
import { shotStateSchema, strikeSchema } from "./shotStates.js";
import { idSchema } from "./values.js";

export const shotSizes = [
  "wide",
  "full",
  "medium",
  "close-up",
  "extreme-close-up",
] as const;

export const shotAngles = [
  "eye-level",
  "low",
  "high",
  "overhead",
  "over-the-shoulder",
] as const;

export const shotLenses = ["wide", "normal", "long"] as const;

export const filmForms = [
  "trailer",
  "short",
  "explainer",
  "music-video",
  "other",
] as const;

export const shotSecondsRange = { minimum: 2, maximum: 10 } as const;

export const musicIntensityRange = { minimum: 1, maximum: 5 } as const;

const musicIntensitySchema = z
  .int()
  .min(musicIntensityRange.minimum)
  .max(musicIntensityRange.maximum);

export const shotSchema = z.strictObject({
  id: idSchema,
  purpose: z.string(),
  action: z.string(),
  placeId: idSchema,
  castIds: z.array(idSchema),
  camera: z.strictObject({
    size: z.enum(shotSizes),
    angle: z.enum(shotAngles),
    lens: z.enum(shotLenses).exactOptional(),
    move: idSchema.exactOptional(),
  }),
  seconds: z
    .number()
    .min(shotSecondsRange.minimum)
    .max(shotSecondsRange.maximum),
  startState: shotStateSchema,
  endState: shotStateSchema,
  inherits: z.string(),
  continuesShotId: idSchema.exactOptional(),
  strikes: z.array(strikeSchema).exactOptional(),
  musicIntensity: musicIntensitySchema.exactOptional(),
  musicHits: z.array(z.number().min(0)).exactOptional(),
  startPicturePrompt: z.string().exactOptional(),
  videoPrompt: z.string().exactOptional(),
  reviews: z.array(clipReviewSchema).exactOptional(),
  startReviews: z.array(startReviewSchema).exactOptional(),
  planNotes: z.array(z.string()).exactOptional(),
  storyFact: idSchema.exactOptional(),
});

export const musicCheckSchema = z.strictObject({
  assetId: idSchema,
  startSeconds: z.number().min(0),
  fit: z.number().min(-1).max(1),
  warnings: z.array(z.string()),
  hits: z.array(z.number().min(0)).exactOptional(),
});

export const storyPlanSchema = z.strictObject({
  form: z.enum(filmForms).exactOptional(),
  logline: z.string(),
  want: z.string(),
  obstacle: z.string(),
  change: z.string(),
  shots: z.array(shotSchema),
  musicEndIntensity: musicIntensitySchema.exactOptional(),
  musicChecks: z.array(musicCheckSchema).exactOptional(),
  review: planReviewSchema.exactOptional(),
  lessons: z.array(lessonSchema).exactOptional(),
  failedPlanChecks: z.int().min(0).exactOptional(),
  planNotes: z.array(z.string()).exactOptional(),
  costEstimateUsd: z.number().min(0).exactOptional(),
});

export type ShotSize = (typeof shotSizes)[number];
export type ShotAngle = (typeof shotAngles)[number];
export type ShotLens = (typeof shotLenses)[number];
export type FilmForm = (typeof filmForms)[number];
export type Shot = z.infer<typeof shotSchema>;
export type MusicCheck = z.infer<typeof musicCheckSchema>;
export type StoryPlan = z.infer<typeof storyPlanSchema>;
