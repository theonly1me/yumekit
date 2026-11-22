import { z } from "zod";
import type { PreviewReply } from "./previewQueue.js";
import type { TextChange } from "./textChange.js";

export type PreviewMessage =
  | { kind: "reply"; reply: PreviewReply }
  | { kind: "text-editing" }
  | { kind: "text-changed"; change: TextChange };

const previewReplySchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("ready"), frameCount: z.number() }),
  z.object({ type: z.literal("sought"), requestId: z.number() }),
  z.object({
    type: z.literal("failed"),
    requestId: z.number(),
    kind: z.string(),
    message: z.string(),
    sceneId: z.string().optional(),
  }),
]);

const textMessageSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("text-editing") }),
  z.object({
    type: z.literal("text-changed"),
    sceneId: z.string(),
    path: z.array(z.union([z.string(), z.number().int().min(0)])).min(1),
    text: z.string().min(1).max(4000),
  }),
]);

export function previewMessageOf(data: unknown): PreviewMessage | undefined {
  const reply = previewReplySchema.safeParse(data);
  if (reply.success) return { kind: "reply", reply: reply.data };
  const text = textMessageSchema.safeParse(data);
  if (!text.success) return undefined;
  if (text.data.type === "text-editing") return { kind: "text-editing" };
  const { sceneId, path, text: changedText } = text.data;
  return { kind: "text-changed", change: { sceneId, path, text: changedText } };
}
