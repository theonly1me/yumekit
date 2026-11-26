import { z } from "zod";
import { exportEntrySchema } from "../export/done/exportEntry.js";
import { permissionEntrySchema } from "./permissions/permissionSchemas.js";
import {
  personMessageExtras,
  questionsEntrySchema,
} from "./questions/questionSchemas.js";

export const stepProgressSchema = z.object({
  done: z.number(),
  total: z.number().optional(),
  message: z.string().optional(),
});

const stepSchema = z.object({
  callId: z.string(),
  tool: z.string(),
  state: z.enum(["running", "done", "failed"]),
  capability: z.string().optional(),
  reason: z.string().optional(),
  progress: stepProgressSchema.optional(),
});

const aboutSchema = z.object({
  sceneId: z.string(),
  clipId: z.string(),
  title: z.string(),
});

export const chatEntrySchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("request"),
    id: z.string(),
    text: z.string(),
    details: z.string().optional(),
    about: aboutSchema.nullable(),
    ...personMessageExtras,
  }),
  z.object({
    kind: z.literal("answer"),
    id: z.string(),
    text: z.string(),
    state: z.enum(["running", "done", "stopped", "failed"]),
    steps: z.array(stepSchema),
    madeWith: z
      .object({
        program: z.string(),
        model: z.string().optional(),
        effort: z.string().optional(),
      })
      .optional(),
  }),
  z.object({
    kind: z.literal("change"),
    id: z.string(),
    by: z.enum(["ai", "person"]),
    summary: z.string(),
    undoSteps: z.number(),
    undone: z.boolean(),
    quiet: z.literal(true).optional(),
  }),
  z.object({ kind: z.literal("notice"), id: z.string(), text: z.string() }),
  z.object({
    kind: z.literal("money"),
    id: z.string(),
    what: z.string(),
    estimateUsd: z.number(),
    leftUsd: z.number(),
    raiseToUsd: z.number(),
    paidCalls: z.number(),
    callsThatFit: z.number(),
    choice: z.enum(["raise", "fewer", "stop", "replaced"]).nullable(),
  }),
  z.object({
    kind: z.literal("steering"),
    id: z.string(),
    text: z.string(),
    details: z.string().optional(),
    about: aboutSchema.nullable(),
    sentAt: z.string(),
    state: z.enum(["waiting", "read"]),
    ...personMessageExtras,
  }),
  questionsEntrySchema,
  permissionEntrySchema,
  exportEntrySchema,
]);

export const chatAgentSchema = z.object({
  id: z.string(),
  name: z.string(),
  signIn: z.enum(["signed-in", "signed-out", "unknown"]),
});

export const chatViewSchema = z.object({
  agent: chatAgentSchema.nullable(),
  state: z.enum(["idle", "running"]),
  entries: z.array(chatEntrySchema),
});

export type ChatEntry = z.infer<typeof chatEntrySchema>;
export type ChatAgent = z.infer<typeof chatAgentSchema>;
export type ChatView = z.infer<typeof chatViewSchema>;
export type RequestEntry = Extract<ChatEntry, { kind: "request" }>;
export type AnswerEntry = Extract<ChatEntry, { kind: "answer" }>;
export type ChangeEntry = Extract<ChatEntry, { kind: "change" }>;
export type SteeringEntry = Extract<ChatEntry, { kind: "steering" }>;
export type MoneyEntry = Extract<ChatEntry, { kind: "money" }>;
export type MoneyChoice = Exclude<MoneyEntry["choice"], "replaced" | null>;
export type AnswerStep = AnswerEntry["steps"][number];
