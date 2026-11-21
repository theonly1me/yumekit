import type { z } from "zod";
import { createEventHub } from "./engineEvents.js";
import {
  healthSchema,
  previewSchema,
  snapshotSchema,
  toolResultSchema,
} from "./snapshot.js";

export type ClientFailure =
  | { kind: "token-rejected" }
  | { kind: "engine-unreachable" }
  | { kind: "request-failed"; message: string };

export type Reply<Value> =
  { ok: true; value: Value } | { ok: false; failure: ClientFailure };

export type RequestMethod = "GET" | "POST" | "PUT" | "DELETE";

export type EngineClient = ReturnType<typeof createEngineClient>;

const failedReply = (failure: ClientFailure) =>
  ({ ok: false, failure }) as const;

async function messageOf(response: Response): Promise<string> {
  const body: unknown = await response.json().catch(() => undefined);
  if (typeof body === "object" && body !== null && "message" in body) {
    return String(body.message);
  }
  return `The engine answered with status ${String(response.status)}.`;
}

export function createEngineClient(token: string) {
  const headers = { authorization: `Bearer ${token}` };
  const events = createEventHub();

  async function send(options: {
    path: string;
    method?: RequestMethod;
    body?: unknown;
  }): Promise<Reply<Response>> {
    const method =
      options.method ?? (options.body === undefined ? "GET" : "POST");
    const init: RequestInit =
      options.body === undefined
        ? { method, headers }
        : {
            method,
            headers: { ...headers, "content-type": "application/json" },
            body: JSON.stringify(options.body),
          };
    try {
      const response = await fetch(options.path, init);
      if (response.status === 401)
        return failedReply({ kind: "token-rejected" });
      if (!response.ok) {
        const message = await messageOf(response);
        return failedReply({ kind: "request-failed", message });
      }
      return { ok: true, value: response };
    } catch {
      return failedReply({ kind: "engine-unreachable" });
    }
  }

  async function readJson<Schema extends z.ZodType>(options: {
    path: string;
    schema: Schema;
    method?: RequestMethod;
    body?: unknown;
  }): Promise<Reply<z.infer<Schema>>> {
    const sent = await send(options);
    if (!sent.ok) return sent;
    const parsed = options.schema.safeParse(
      await sent.value.json().catch(() => undefined),
    );
    return parsed.success
      ? { ok: true, value: parsed.data }
      : failedReply({
          kind: "request-failed",
          message: `The engine sent data that the editor cannot read: ${parsed.error.message}`,
        });
  }

  return {
    token,
    events,
    health: () => readJson({ path: "/api/health", schema: healthSchema }),
    project: () => readJson({ path: "/api/project", schema: snapshotSchema }),
    preview: (outputId: string) =>
      readJson({
        path: `/api/preview?output=${encodeURIComponent(outputId)}`,
        schema: previewSchema,
      }),
    callTool: (call: { name: string; input: object; callId?: string }) =>
      readJson({
        path: `/api/tools/${encodeURIComponent(call.name)}`,
        schema: toolResultSchema,
        body: { input: call.input, callId: call.callId },
      }),
    readJson,
    assetFile: async (assetId: string): Promise<Reply<Blob>> => {
      const sent = await send({
        path: `/api/assets/${encodeURIComponent(assetId)}/file`,
      });
      return sent.ok ? { ok: true, value: await sent.value.blob() } : sent;
    },
    eventsUrl: () => {
      const url = new URL("/api/events", window.location.href);
      url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
      url.searchParams.set("token", token);
      return url.toString();
    },
  };
}
