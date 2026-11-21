import { z } from "zod";
import type { EngineClient } from "../engine/engineClient.js";
import type { Asset } from "../engine/snapshot.js";
import { failureTextOf } from "../tools/requestText.js";

const failureSchema = z.object({
  kind: z.string(),
  message: z.string(),
  hint: z.string().optional(),
  used_seconds: z.number().optional(),
  requested_seconds: z.number().optional(),
  limit_seconds: z.number().optional(),
});

export type ToolFailure = z.infer<typeof failureSchema>;

export type CallOutcome =
  | { ok: true; data: Record<string, unknown> }
  | { ok: false; failure: ToolFailure };

const idLimit = 64;
const suffixRoom = 4;

export async function callTool(options: {
  client: EngineClient;
  name: string;
  input: object;
  callId?: string;
}): Promise<CallOutcome> {
  const { client, ...call } = options;
  const reply = await client.callTool(call);
  if (!reply.ok) {
    return {
      ok: false,
      failure: {
        kind: reply.failure.kind,
        message: failureTextOf(reply.failure),
      },
    };
  }
  const { data } = reply.value;
  if (!reply.value.isError) return { ok: true, data };
  const parsed = failureSchema.safeParse(data);
  return {
    ok: false,
    failure: parsed.success
      ? parsed.data
      : { kind: "tool-failed", message: reply.value.text },
  };
}

export function textField(options: {
  data: Record<string, unknown>;
  name: string;
}): string {
  const value = options.data[options.name];
  return typeof value === "string" ? value : "";
}

export function uniqueAssetId(options: { base: string; assets: Asset[] }) {
  const cleaned = options.base
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, idLimit - suffixRoom);
  const base = cleaned === "" ? "asset" : cleaned;
  const taken = new Set(options.assets.map((asset) => asset.id));
  let candidate = base;
  for (let suffix = 2; taken.has(candidate); suffix += 1) {
    candidate = `${base}-${String(suffix)}`;
  }
  return candidate;
}
