import { z } from "zod";

export const takeSteps = ["story", "pictures", "clips", "cut"] as const;

export type TakeStep = (typeof takeSteps)[number];

const leadText = {
  note: z.string().optional(),
  approved: z.literal(true).optional(),
};

const takeItemSchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("asset"),
    id: z.string(),
    whatToCheck: z.string().optional(),
    replaces: z.string().optional(),
    ...leadText,
  }),
  z.object({ kind: z.literal("story"), id: z.string(), ...leadText }),
  z.object({
    kind: z.literal("cut"),
    id: z.string(),
    outputId: z.string(),
    file: z.string(),
    whatToCheck: z.string().optional(),
    ...leadText,
  }),
]);

const takeNoteSchema = z.object({
  itemId: z.string(),
  text: z.string(),
  pin: z.object({ x: z.number(), y: z.number() }).optional(),
  seconds: z.number().optional(),
  quote: z.string().optional(),
  dropped: z.literal(true).optional(),
});

export const takeSchema = z.object({
  id: z.string(),
  chapterId: z.string().optional(),
  step: z.enum(takeSteps),
  number: z.number(),
  state: z.enum(["open", "ready", "sent"]),
  openedAt: z.string(),
  readyAt: z.string().optional(),
  sentAt: z.string().optional(),
  items: z.array(takeItemSchema),
  notes: z.array(takeNoteSchema),
  costUsd: z.number().optional(),
  nextStepEstimateUsd: z.number().optional(),
});

export const chapterSchema = z.object({
  id: z.string(),
  title: z.string(),
  shotIds: z.array(z.string()),
});

export type Take = z.infer<typeof takeSchema>;
export type TakeItem = Take["items"][number];
export type TakeNote = Take["notes"][number];
export type Chapter = z.infer<typeof chapterSchema>;
