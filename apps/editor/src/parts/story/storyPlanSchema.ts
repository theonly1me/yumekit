import { z } from "zod";

const countSchema = z.object({
  object: z.string(),
  expected: z.number(),
  seen: z.number(),
  seconds: z.number().optional(),
});

const reviewSchema = z.object({
  assetId: z.string(),
  verdict: z.enum(["keep", "cut", "redo"]),
  by: z.enum(["maker", "critic"]).optional(),
  faults: z.array(z.string()),
  keepFromSeconds: z.number().optional(),
  keepToSeconds: z.number().optional(),
  endPictureAssetId: z.string().optional(),
  measures: z.object({ warnings: z.array(z.string()) }),
  critic: z
    .object({
      counts: z.array(countSchema),
      missed: z.array(z.string()),
      seconds: z.number(),
    })
    .optional(),
});

const stateEntrySchema = z.object({
  castId: z.string(),
  count: z.number().optional(),
  where: z.string(),
  screen: z.string(),
  facing: z.string(),
  heldBy: z.object({ castId: z.string(), hand: z.string() }).optional(),
  state: z.string(),
  entersFrom: z.string().optional(),
});

const shotStateSchema = z.union([z.string(), z.array(stateEntrySchema)]);

const shotSchema = z.object({
  id: z.string(),
  purpose: z.string(),
  action: z.string(),
  placeId: z.string(),
  castIds: z.array(z.string()),
  camera: z.object({
    size: z.string(),
    angle: z.string(),
    lens: z.string().optional(),
    move: z.string().optional(),
  }),
  seconds: z.number(),
  startState: shotStateSchema,
  endState: shotStateSchema,
  inherits: z.string(),
  musicIntensity: z.number().optional(),
  reviews: z.array(reviewSchema).optional(),
});

const musicCheckSchema = z.object({
  assetId: z.string(),
  startSeconds: z.number(),
  fit: z.number(),
  warnings: z.array(z.string()),
});

export const storyPlanSchema = z.object({
  logline: z.string(),
  want: z.string(),
  obstacle: z.string(),
  change: z.string(),
  shots: z.array(shotSchema),
  musicChecks: z.array(musicCheckSchema).optional(),
});

export type StoryPlan = z.infer<typeof storyPlanSchema>;
export type PlanShot = z.infer<typeof shotSchema>;
export type ShotReview = z.infer<typeof reviewSchema>;
export type ShotState = z.infer<typeof shotStateSchema>;
export type MusicCheckFacts = z.infer<typeof musicCheckSchema>;
