import type { RunningEngine } from "@yumekit/engine";
import { WebSocket } from "ws";
import { z } from "zod";

const progressEventSchema = z.object({
  type: z.literal("call-progress"),
  callId: z.string(),
  done: z.number(),
  total: z.number().optional(),
  message: z.string().optional(),
});

export type ProgressEvent = z.infer<typeof progressEventSchema>;

export interface EngineEvents {
  onProgress: (subscription: {
    callId: string;
    listener: (event: ProgressEvent) => void;
  }) => () => void;
  close: () => void;
}

function eventOf(data: Buffer): unknown {
  try {
    const value: unknown = JSON.parse(data.toString());
    return value;
  } catch {
    return undefined;
  }
}

export async function followEngineEvents(options: {
  engine: RunningEngine;
  onEngineClosed: () => void;
}): Promise<EngineEvents | undefined> {
  const { engine } = options;
  const eventsUrl = new URL(
    "/api/events",
    engine.origin.replace(/^http/, "ws"),
  );
  eventsUrl.searchParams.set("token", engine.token);
  eventsUrl.searchParams.set("client", "agent");
  const socket = new WebSocket(eventsUrl);
  const listeners = new Map<string, (event: ProgressEvent) => void>();
  socket.on("message", (data: Buffer) => {
    const progress = progressEventSchema.safeParse(eventOf(data));
    if (progress.success) listeners.get(progress.data.callId)?.(progress.data);
  });
  const opened = Promise.withResolvers<boolean>();
  socket.on("open", () => {
    opened.resolve(true);
  });
  socket.on("error", () => {
    opened.resolve(false);
  });
  socket.on("close", () => {
    opened.resolve(false);
    options.onEngineClosed();
  });
  if (!(await opened.promise)) return undefined;
  return {
    onProgress: ({ callId, listener }) => {
      listeners.set(callId, listener);
      return () => listeners.delete(callId);
    },
    close: () => {
      socket.removeAllListeners("close");
      socket.close();
    },
  };
}
