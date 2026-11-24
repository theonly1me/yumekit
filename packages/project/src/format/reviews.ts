import { z } from "zod";
import { idSchema } from "./values.js";

export const reviewVerdicts = ["keep", "cut", "redo"] as const;

export const sheetVerdicts = ["pass", "fail"] as const;

export const reviewers = ["maker", "critic"] as const;

const motionMeasuresSchema = z.strictObject({
  motion: z.number().min(0),
  worldMotion: z.number().min(0),
  cameraMotion: z.number().min(0),
  startDifference: z.number().min(0).exactOptional(),
  warnings: z.array(z.string()),
});

export const objectCountSchema = z.strictObject({
  object: z.string(),
  expected: z.int().min(0),
  seen: z.int().min(0),
  seconds: z.number().min(0).exactOptional(),
});

export const warningAnswerSchema = z.strictObject({
  kind: z.string(),
  seconds: z.number().min(0).exactOptional(),
  cause: z.enum(["fault", "harmless"]),
  seen: z.string(),
});

export const criticRecordSchema = z.strictObject({
  answers: z.array(z.strictObject({ item: z.int().min(1), seen: z.string() })),
  counts: z.array(objectCountSchema),
  missed: z.array(z.string()),
  warnings: z.array(warningAnswerSchema),
  seconds: z.number().min(0),
});

export const clipReviewSchema = z.strictObject({
  assetId: idSchema,
  verdict: z.enum(reviewVerdicts),
  by: z.enum(reviewers).exactOptional(),
  faults: z.array(z.string()),
  keepFromSeconds: z.number().min(0).exactOptional(),
  keepToSeconds: z.number().positive().exactOptional(),
  endPictureAssetId: idSchema.exactOptional(),
  measures: motionMeasuresSchema,
  critic: criticRecordSchema.exactOptional(),
});

export const sheetReviewSchema = z.strictObject({
  verdict: z.enum(sheetVerdicts),
  faults: z.array(z.string()),
  assetIds: z.array(idSchema),
  counts: z.array(objectCountSchema),
  answers: z.array(z.strictObject({ item: z.int().min(1), seen: z.string() })),
});

export type ReviewVerdict = (typeof reviewVerdicts)[number];
export type SheetVerdict = (typeof sheetVerdicts)[number];
export type MotionMeasures = z.infer<typeof motionMeasuresSchema>;
export type ObjectCount = z.infer<typeof objectCountSchema>;
export type WarningAnswer = z.infer<typeof warningAnswerSchema>;
export type CriticRecord = z.infer<typeof criticRecordSchema>;
export type ClipReview = z.infer<typeof clipReviewSchema>;
export type SheetReview = z.infer<typeof sheetReviewSchema>;
