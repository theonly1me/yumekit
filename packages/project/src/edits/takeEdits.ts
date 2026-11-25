import { z } from "zod";
import { chapterSchema } from "../format/storyPlan.js";
import { takeItemSchema, takeNoteSchema, takeSteps } from "../format/takes.js";
import { idSchema } from "../format/values.js";

const timeSchema = z.iso.datetime();

export const takeEditSchemas = [
  z.strictObject({
    kind: z.literal("setChapters"),
    chapters: z.array(chapterSchema),
  }),
  z.strictObject({
    kind: z.literal("setApprovePicturesFirst"),
    approvePicturesFirst: z.boolean(),
  }),
  z.strictObject({
    kind: z.literal("openTake"),
    takeId: idSchema,
    chapterId: idSchema.exactOptional(),
    step: z.enum(takeSteps),
    at: timeSchema,
  }),
  z.strictObject({
    kind: z.literal("fillTake"),
    items: z.array(takeItemSchema).min(1),
  }),
  z.strictObject({
    kind: z.literal("readyTake"),
    takeId: idSchema,
    items: z.array(takeItemSchema).min(1),
    at: timeSchema,
    costUsd: z.number().min(0),
    nextStepEstimateUsd: z.number().min(0).exactOptional(),
  }),
  z.strictObject({
    kind: z.literal("sendTake"),
    takeId: idSchema,
    notes: z.array(takeNoteSchema),
    at: timeSchema,
  }),
] as const;
