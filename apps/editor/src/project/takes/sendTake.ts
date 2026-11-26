import { z } from "zod";
import type { EngineClient } from "../../engine/engineClient.js";
import { failureTextOf } from "../../tools/requestText.js";
import type { SentNote } from "./review/sentNotes.js";

const sentSchema = z.object({ take: z.object({ id: z.string() }) });

export type SendOutcome = { ok: true } | { ok: false; message: string };

export type SendNext = "go" | "fewer" | "stop";

export async function sendTake(options: {
  client: EngineClient;
  takeId: string;
  notes: SentNote[];
  next?: SendNext;
}): Promise<SendOutcome> {
  const sent = await options.client.readJson({
    path: `/api/takes/${encodeURIComponent(options.takeId)}/send`,
    schema: sentSchema,
    body: { notes: options.notes, next: options.next ?? "go" },
  });
  return sent.ok
    ? { ok: true }
    : { ok: false, message: failureTextOf(sent.failure) };
}
