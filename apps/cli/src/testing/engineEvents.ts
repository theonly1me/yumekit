import { setTimeout as delay } from "node:timers/promises";
import { onTestFinished } from "vitest";
import { WebSocket } from "ws";

export interface ReceivedEvents {
  messages: string[];
  waitFor: (text: string) => Promise<string>;
}

export async function receiveEngineEvents(options: {
  port: number;
  token: string;
}): Promise<ReceivedEvents> {
  const socket = new WebSocket(
    `ws://127.0.0.1:${String(options.port)}/api/events?token=${options.token}`,
  );
  const messages: string[] = [];
  socket.on("message", (data: Buffer) => messages.push(data.toString()));
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
    waitFor: async (text) => {
      const deadline = Date.now() + 20_000;
      while (Date.now() < deadline) {
        const found = messages.find((message) => message.includes(text));
        if (found !== undefined) return found;
        await delay(20);
      }
      throw new Error(`No event with ${text} in ${JSON.stringify(messages)}`);
    },
  };
}
