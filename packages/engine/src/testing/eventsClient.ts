import { setTimeout as delay } from "node:timers/promises";
import { onTestFinished } from "vitest";
import { WebSocket } from "ws";

export interface EventsClient {
  messages: unknown[];
  waitFor: (matches: (message: unknown) => boolean) => Promise<unknown>;
  closed: Promise<number>;
  close: () => void;
}

const waitMilliseconds = 20_000;

export function eventsUrlOf(options: { port: number; token: string }): string {
  return `ws://127.0.0.1:${String(options.port)}/api/events?token=${options.token}`;
}

export function upgradeStatusOf(options: {
  url: string;
  headers?: Record<string, string>;
}): Promise<number> {
  const answered = Promise.withResolvers<number>();
  const socket = new WebSocket(options.url, { headers: options.headers ?? {} });
  socket.on("unexpected-response", (...parameters) => {
    const [, response] = parameters;
    answered.resolve(response.statusCode ?? 0);
    response.resume();
  });
  socket.on("open", () => {
    answered.resolve(101);
    socket.close();
  });
  socket.on("error", () => {
    answered.resolve(0);
  });
  return answered.promise;
}

export async function openEvents(options: {
  port: number;
  token: string;
  isAgent?: boolean;
}): Promise<EventsClient> {
  const url = eventsUrlOf(options);
  const socket = new WebSocket(
    options.isAgent === true ? `${url}&client=agent` : url,
  );
  const messages: unknown[] = [];
  const closed = Promise.withResolvers<number>();
  socket.on("message", (data: Buffer) => {
    messages.push(JSON.parse(data.toString()));
  });
  socket.on("close", (code: number) => {
    closed.resolve(code);
  });
  const opened = Promise.withResolvers<undefined>();
  socket.on("open", () => {
    opened.resolve(undefined);
  });
  socket.on("error", opened.reject);
  await opened.promise;
  onTestFinished(() => {
    socket.terminate();
  });
  return {
    messages,
    closed: closed.promise,
    close: () => {
      socket.close();
    },
    waitFor: async (matches) => {
      const deadline = Date.now() + waitMilliseconds;
      while (Date.now() < deadline) {
        const found = messages.find(matches);
        if (found !== undefined) return found;
        await delay(20);
      }
      throw new Error(`No matching event in ${JSON.stringify(messages)}`);
    },
  };
}

export function isEventOfType(type: string): (message: unknown) => boolean {
  return (message) =>
    typeof message === "object" &&
    message !== null &&
    Reflect.get(message, "type") === type;
}
