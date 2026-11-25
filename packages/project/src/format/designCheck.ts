import { z } from "zod";
import { idSchema } from "./values.js";

export const designAnswers = ["yes", "no", "cannot-see"] as const;

export const designCheckers = ["critic", "lead", "person"] as const;

export const designFrameSchema = z.strictObject({
  castId: idSchema,
  lookId: idSchema,
  seconds: z.number().min(0).exactOptional(),
  answers: z.array(
    z.strictObject({
      question: z.string(),
      answer: z.enum(designAnswers),
      seen: z.string(),
    }),
  ),
});

export const designCheckSchema = z.strictObject({
  assetId: idSchema,
  by: z.enum(designCheckers),
  frames: z.array(designFrameSchema),
  breaks: z.array(z.string()),
  cleanUntilSeconds: z.number().min(0).exactOptional(),
  endPictureAssetId: idSchema.exactOptional(),
  personKept: z.strictObject({ words: z.string().min(1) }).exactOptional(),
});

export type DesignAnswer = (typeof designAnswers)[number];
export type DesignChecker = (typeof designCheckers)[number];
export type DesignFrame = z.infer<typeof designFrameSchema>;
export type DesignCheck = z.infer<typeof designCheckSchema>;
