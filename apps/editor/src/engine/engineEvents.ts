import { z } from "zod";
import { chatEntrySchema } from "../chat/chatSchemas.js";

const engineEventSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("project-changed"), revision: z.number() }),
  z.object({
    type: z.literal("call-progress"),
    callId: z.string(),
    done: z.number(),
    total: z.number().optional(),
    message: z.string().optional(),
  }),
  z.object({ type: z.literal("media-servers-changed") }),
  z.object({ type: z.literal("agents-changed"), connected: z.number() }),
  z.object({ type: z.literal("engine-closing") }),
  z.object({ type: z.literal("chat-changed"), entry: chatEntrySchema }),
  z.object({
    type: z.literal("chat-text"),
    id: z.string(),
    text: z.string(),
  }),
]);

export type EngineEvent =
  z.infer<typeof engineEventSchema> | { type: "connection-opened" };

export type EventListener = (event: EngineEvent) => void;

export function engineEventOf(data: unknown): EngineEvent | undefined {
  if (typeof data !== "string") return undefined;
  try {
    const parsed = engineEventSchema.safeParse(JSON.parse(data));
    return parsed.success ? parsed.data : undefined;
  } catch {
    return undefined;
  }
}

export function createEventHub() {
  const listeners = new Set<EventListener>();
  return {
    listen: (listener: EventListener) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    send: (event: EngineEvent) => {
      for (const listener of listeners) listener(event);
    },
  };
}

export type EventHub = ReturnType<typeof createEventHub>;
