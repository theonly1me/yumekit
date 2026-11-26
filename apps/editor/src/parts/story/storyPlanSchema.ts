import { chapterSchema } from "@yumekit/project/takes";
import { z } from "zod";
import { designCheckSchema } from "../../cast/castEntries.js";
import { chapterSchema } from "../../project/takes/takeSchema.js";

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
  notes: z.array(z.string()).optional(),
});

const startReviewSchema = z.object({
  assetId: z.string(),
  verdict: z.enum(["pass", "fail"]),
  faults: z.array(z.string()),
  notes: z.array(z.string()),
});

const planReviewSchema = z.object({
  verdict: z.enum(["pass", "fail"]),
  faults: z.array(z.string()),
  notes: z.array(z.string()),
  shots: z.array(
    z.object({
      shotId: z.string(),
      difficulty: z.number(),
      limits: z.array(z.string()),
      faults: z.array(z.string()),
      notes: z.array(z.string()),
    }),
  ),
  easiestShotId: z.string(),
  hardestShotId: z.string(),
});

const lessonSchema = z.object({
  text: z.string(),
  cause: z.string(),
  shotId: z.string().optional(),
  isLimit: z.boolean(),
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
  startReviews: z.array(startReviewSchema).optional(),
  planNotes: z.array(z.string()).optional(),
  storyFact: z.string().optional(),
  castLooks: z.record(z.string(), z.string()).optional(),
  designChecks: z.array(designCheckSchema).optional(),
});

const musicCheckSchema = z.object({
  assetId: z.string(),
  startSeconds: z.number(),
  fit: z.number(),
  warnings: z.array(z.string()),
});

export const storyPlanSchema = z.object({
  form: z.string().optional(),
  logline: z.string(),
  want: z.string(),
  obstacle: z.string(),
  change: z.string(),
  shots: z.array(shotSchema),
  musicChecks: z.array(musicCheckSchema).optional(),
  review: planReviewSchema.optional(),
  lessons: z.array(lessonSchema).optional(),
  failedPlanChecks: z.number().optional(),
  costEstimateUsd: z.number().optional(),
  planNotes: z.array(z.string()).optional(),
  chapters: z.array(chapterSchema).optional(),
});

export type StoryPlan = z.infer<typeof storyPlanSchema>;
export type PlanShot = z.infer<typeof shotSchema>;
export type ShotReview = z.infer<typeof reviewSchema>;
export type ShotState = z.infer<typeof shotStateSchema>;
export type MusicCheckFacts = z.infer<typeof musicCheckSchema>;
export type PlanReviewFacts = z.infer<typeof planReviewSchema>;
