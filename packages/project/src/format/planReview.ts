import { z } from "zod";
import { sheetVerdicts } from "./reviews.js";
import { idSchema } from "./values.js";

export const shotDifficultyRange = { minimum: 1, maximum: 5 } as const;

const shotCheckSchema = z.strictObject({
  shotId: idSchema,
  difficulty: z
    .int()
    .min(shotDifficultyRange.minimum)
    .max(shotDifficultyRange.maximum),
  limits: z.array(z.string()),
  faults: z.array(z.string()),
  notes: z.array(z.string()),
});

const castCheckSchema = z.strictObject({
  castId: idSchema,
  faults: z.array(z.string()),
  notes: z.array(z.string()),
});

const briefFaultSchema = z.strictObject({
  castId: idSchema,
  shotId: idSchema.exactOptional(),
  briefFact: z.string(),
  restore: z.string(),
  seen: z.string(),
});

export const planReviewSchema = z.strictObject({
  verdict: z.enum(sheetVerdicts),
  planKey: z.string(),
  faults: z.array(z.string()),
  notes: z.array(z.string()),
  shots: z.array(shotCheckSchema),
  cast: z.array(castCheckSchema),
  briefFaults: z.array(briefFaultSchema).exactOptional(),
  easiestShotId: idSchema,
  hardestShotId: idSchema,
  seconds: z.number().min(0),
});

export const lessonSchema = z.strictObject({
  text: z.string(),
  cause: z.string(),
  shotId: idSchema.exactOptional(),
  castId: idSchema.exactOptional(),
  isLimit: z.boolean(),
});

export type PlanReview = z.infer<typeof planReviewSchema>;
export type PlanShotCheck = z.infer<typeof shotCheckSchema>;
export type PlanCastCheck = z.infer<typeof castCheckSchema>;
export type PlanBriefFault = z.infer<typeof briefFaultSchema>;
export type Lesson = z.infer<typeof lessonSchema>;
