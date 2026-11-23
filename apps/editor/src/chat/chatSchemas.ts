import { z } from "zod";

const stepSchema = z.object({
  callId: z.string(),
  tool: z.string(),
  state: z.enum(["running", "done", "failed"]),
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
  }),
  z.object({
    kind: z.literal("answer"),
    id: z.string(),
    text: z.string(),
    state: z.enum(["running", "done", "stopped", "failed"]),
    steps: z.array(stepSchema),
  }),
  z.object({
    kind: z.literal("change"),
    id: z.string(),
    by: z.enum(["ai", "person"]),
    summary: z.string(),
    undoSteps: z.number(),
    undone: z.boolean(),
  }),
  z.object({ kind: z.literal("notice"), id: z.string(), text: z.string() }),
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
export type AnswerStep = AnswerEntry["steps"][number];
