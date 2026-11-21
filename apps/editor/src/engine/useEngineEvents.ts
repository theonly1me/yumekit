import { useEffect, useRef } from "react";
import { z } from "zod";
import type { EngineClient } from "./engineClient.js";

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
  z.object({ type: z.literal("engine-closing") }),
]);

export type EngineEvent = z.infer<typeof engineEventSchema>;

const reconnectMilliseconds = 1_000;

function eventOf(data: unknown): EngineEvent | undefined {
  if (typeof data !== "string") return undefined;
  try {
    const parsed = engineEventSchema.safeParse(JSON.parse(data));
    return parsed.success ? parsed.data : undefined;
  } catch {
    return undefined;
  }
}

export function useEngineEvents(options: {
  client: EngineClient;
  onEvent: (event: EngineEvent) => void;
}) {
  const { client } = options;
  const onEvent = useRef(options.onEvent);

  useEffect(() => {
    onEvent.current = options.onEvent;
  });

  useEffect(() => {
    let isClosed = false;
    let socket: WebSocket | undefined;
    let reconnectTimer: number | undefined;

    function connect(): void {
      socket = new WebSocket(client.eventsUrl());
      socket.addEventListener("message", (message) => {
        const event = eventOf(message.data);
        if (event !== undefined) onEvent.current(event);
      });
      socket.addEventListener("close", () => {
        if (isClosed) return;
        reconnectTimer = window.setTimeout(connect, reconnectMilliseconds);
      });
    }

    connect();
    return () => {
      isClosed = true;
      window.clearTimeout(reconnectTimer);
      socket?.close();
    };
  }, [client]);
}
