import { z } from "zod";
import { takeTagLimit, takeTagSchema, takeTextLimit } from "./takes.js";
import { idSchema } from "./values.js";

export const draftVerdicts = [
  "approved",
  "change",
  "question",
  "dropped",
] as const;

export const draftMarkLimit = 50;

const markIdSchema = z.string().min(1).max(64);

const wordsSchema = z.string().max(takeTextLimit);

const partSchema = z.number().min(0).max(1);

export const itemDraftSchema = z.strictObject({
  verdict: z.enum(draftVerdicts).exactOptional(),
  use: z.literal(true).exactOptional(),
  tags: z.array(takeTagSchema).max(takeTagLimit),
  note: wordsSchema,
  pins: z
    .array(
      z.strictObject({
        id: markIdSchema,
        x: partSchema,
        y: partSchema,
        text: wordsSchema,
      }),
    )
    .max(draftMarkLimit),
  moments: z
    .array(
      z.strictObject({
        id: markIdSchema,
        seconds: z.number().min(0),
        text: wordsSchema,
      }),
    )
    .max(draftMarkLimit),
  quotes: z
    .array(
      z.strictObject({
        id: markIdSchema,
        quote: z.string().min(1).max(takeTextLimit),
        text: wordsSchema,
      }),
    )
    .max(draftMarkLimit),
});

export const draftItemIdSchema = idSchema;

export const takeDraftSchema = z.strictObject({
  items: z.record(draftItemIdSchema, itemDraftSchema),
});

export type DraftVerdict = (typeof draftVerdicts)[number];
export type ItemDraft = z.infer<typeof itemDraftSchema>;
export type TakeDraft = z.infer<typeof takeDraftSchema>;
