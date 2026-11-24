import { z } from "zod";

const stepSchema = z.object({
  callId: z.string(),
  tool: z.string(),
  state: z.enum(["running", "done", "failed"]),
  capability: z.string().optional(),
  reason: z.string().optional(),
  progress: z
    .object({
      done: z.number(),
      total: z.number().optional(),
      message: z.string().optional(),
    })
    .optional(),
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
    undoSteps: z.number().int().min(0),
    undone: z.boolean(),
  }),
  z.object({ kind: z.literal("notice"), id: z.string(), text: z.string() }),
  z.object({
    kind: z.literal("steering"),
    id: z.string(),
    text: z.string(),
    details: z.string().optional(),
    about: aboutSchema.nullable(),
    sentAt: z.string(),
    state: z.enum(["waiting", "read"]),
  }),
]);

export const chatFileSchema = z.object({
  sessionId: z.string().nullable(),
  entries: z.array(chatEntrySchema),
  redoChangeIds: z.array(z.string()).default([]),
});

export type ChatEntry = z.infer<typeof chatEntrySchema>;
export type ChatFile = z.infer<typeof chatFileSchema>;
export type RequestEntry = Extract<ChatEntry, { kind: "request" }>;
export type AnswerEntry = Extract<ChatEntry, { kind: "answer" }>;
export type ChangeEntry = Extract<ChatEntry, { kind: "change" }>;
export type SteeringEntry = Extract<ChatEntry, { kind: "steering" }>;
export type RequestAbout = z.infer<typeof aboutSchema>;
export type ChangeAuthor = ChangeEntry["by"];

export type ChatFailureKind =
  | "chat-busy"
  | "no-agent"
  | "agent-signed-out"
  | "no-server-command"
  | "settings-not-valid"
  | "clip-not-found"
  | "change-not-found";

export interface ChatFailure {
  kind: ChatFailureKind;
  message: string;
}

export interface ChatAgent {
  id: string;
  name: string;
  signIn: "signed-in" | "signed-out" | "unknown";
}

export interface ChatView {
  agent: ChatAgent | null;
  state: "idle" | "running";
  entries: ChatEntry[];
}
