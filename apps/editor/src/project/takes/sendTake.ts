import { z } from "zod";
import type { EngineClient } from "../../engine/engineClient.js";
import { failureTextOf } from "../../tools/requestText.js";
import type { SentNote } from "./notes/draftNotes.js";

const sentSchema = z.object({ take: z.object({ id: z.string() }) });

export type SendOutcome = { ok: true } | { ok: false; message: string };

export async function sendTake(options: {
  client: EngineClient;
  takeId: string;
  notes: SentNote[];
}): Promise<SendOutcome> {
  const sent = await options.client.readJson({
    path: `/api/takes/${encodeURIComponent(options.takeId)}/send`,
    schema: sentSchema,
    body: { notes: options.notes },
  });
  return sent.ok
    ? { ok: true }
    : { ok: false, message: failureTextOf(sent.failure) };
}
