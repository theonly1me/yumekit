import { z } from "zod";
import type { PreviewReply } from "./previewQueue.js";

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

export function previewReplyOf(data: unknown): PreviewReply | undefined {
  const parsed = previewReplySchema.safeParse(data);
  return parsed.success ? parsed.data : undefined;
}
