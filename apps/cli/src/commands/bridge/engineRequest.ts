import { request } from "node:http";
import type { RunningEngine } from "@yumekit/engine";

export interface EngineAnswer {
  status: number;
  body: unknown;
}

function parsedOf(text: string): unknown {
  try {
    const value: unknown = JSON.parse(text);
    return value;
  } catch {
    return undefined;
  }
}

export function engineRequest(options: {
  engine: RunningEngine;
  method: "GET" | "POST";
  path: string;
  body?: object;
}): Promise<EngineAnswer> {
  const answered = Promise.withResolvers<EngineAnswer>();
  const sent = request(
    new URL(options.path, options.engine.origin),
    {
      method: options.method,
      headers: {
        authorization: `Bearer ${options.engine.token}`,
        "x-yumekit-client": "agent",
        "content-type": "application/json",
      },
    },
    (response) => {
      const chunks: Buffer[] = [];
      response.on("data", (chunk: Buffer) => chunks.push(chunk));
      response.on("end", () => {
        answered.resolve({
          status: response.statusCode ?? 0,
          body: parsedOf(Buffer.concat(chunks).toString()),
        });
      });
      response.on("error", answered.reject);
    },
  );
  sent.on("error", answered.reject);
  sent.end(
    options.body === undefined ? undefined : JSON.stringify(options.body),
  );
  return answered.promise;
}
