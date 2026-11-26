import { z } from "zod";
import { idSchema } from "./values.js";

export const takeSteps = ["story", "pictures", "clips", "cut"] as const;

export const takeStates = ["open", "ready", "sent"] as const;

export const storyItemId = "story";

export const cutItemId = "cut";

export const takeTextLimit = 4000;

const leadTextSchema = z.string().trim().min(1).max(takeTextLimit);

const approvedSchema = z.literal(true).exactOptional();

export const takeItemSchema = z.discriminatedUnion("kind", [
  z.strictObject({
    kind: z.literal("asset"),
    id: idSchema,
    note: leadTextSchema.exactOptional(),
    whatToCheck: leadTextSchema.exactOptional(),
    replaces: idSchema.exactOptional(),
    approved: approvedSchema,
  }),
  z.strictObject({
    kind: z.literal("story"),
    id: z.literal(storyItemId),
    note: leadTextSchema.exactOptional(),
    approved: approvedSchema,
  }),
  z.strictObject({
    kind: z.literal("cut"),
    id: z.literal(cutItemId),
    outputId: idSchema,
    file: z.string().min(1),
    note: leadTextSchema.exactOptional(),
    whatToCheck: leadTextSchema.exactOptional(),
    approved: approvedSchema,
  }),
]);

const placeCount = (note: {
  pin?: unknown;
  seconds?: unknown;
  quote?: unknown;
}) =>
  [note.pin, note.seconds, note.quote].filter((place) => place !== undefined)
    .length;

export const takeNoteSchema = z
  .strictObject({
    itemId: z.string().min(1).max(64),
    text: z.string().trim().max(takeTextLimit),
    pin: z
      .strictObject({
        x: z.number().min(0).max(1),
        y: z.number().min(0).max(1),
      })
      .exactOptional(),
    seconds: z.number().min(0).exactOptional(),
    quote: z.string().trim().min(1).max(takeTextLimit).exactOptional(),
    dropped: z.literal(true).exactOptional(),
  })
  .refine((note) => placeCount(note) <= 1, {
    message: "A note has at most one of pin, seconds, and quote.",
  })
  .refine((note) => note.text !== "" || note.dropped === true, {
    message: "A note needs text, unless it drops the item.",
  });

const timeSchema = z.iso.datetime();

export const takeSchema = z.strictObject({
  id: idSchema,
  chapterId: idSchema.exactOptional(),
  step: z.enum(takeSteps),
  number: z.int().min(1),
  state: z.enum(takeStates),
  openedAt: timeSchema,
  readyAt: timeSchema.exactOptional(),
  sentAt: timeSchema.exactOptional(),
  items: z.array(takeItemSchema),
  notes: z.array(takeNoteSchema),
  costUsd: z.number().min(0).exactOptional(),
  nextStepEstimateUsd: z.number().min(0).exactOptional(),
});

export const takesFileSchema = z.strictObject({ takes: z.array(takeSchema) });

export const takesFile = "takes.json";

export type TakeStep = (typeof takeSteps)[number];
export type TakeState = (typeof takeStates)[number];
export type TakeItem = z.infer<typeof takeItemSchema>;
export type TakeNote = z.infer<typeof takeNoteSchema>;
export type Take = z.infer<typeof takeSchema>;
