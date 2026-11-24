import { z } from "zod";

const reviewSchema = z.object({
  assetId: z.string(),
  verdict: z.enum(["keep", "cut", "redo"]),
  faults: z.array(z.string()),
  keepFromSeconds: z.number().optional(),
  keepToSeconds: z.number().optional(),
  endPictureAssetId: z.string().optional(),
  measures: z.object({ warnings: z.array(z.string()) }),
});

const shotSchema = z.object({
  id: z.string(),
  purpose: z.string(),
  action: z.string(),
  placeId: z.string(),
  castIds: z.array(z.string()),
  camera: z.object({
    size: z.string(),
    angle: z.string(),
    move: z.string().optional(),
  }),
  seconds: z.number(),
  startState: z.string(),
  endState: z.string(),
  inherits: z.string(),
  reviews: z.array(reviewSchema).optional(),
});

export const storyPlanSchema = z.object({
  logline: z.string(),
  want: z.string(),
  obstacle: z.string(),
  change: z.string(),
  shots: z.array(shotSchema),
});

export type StoryPlan = z.infer<typeof storyPlanSchema>;
export type PlanShot = z.infer<typeof shotSchema>;
export type ShotReview = z.infer<typeof reviewSchema>;
