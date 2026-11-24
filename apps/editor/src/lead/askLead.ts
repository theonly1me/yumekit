import { chatRequestsOf } from "../chat/chatRequests.js";
import type { AnswerEntry } from "../chat/chatSchemas.js";
import type { EngineClient } from "../engine/engineClient.js";
import { askInputOf } from "../parts/fixedRequests.js";
import { failureTextOf } from "../tools/requestText.js";
import type { ExactRequest } from "./exactRequests.js";

export type LeadAnswer =
  | { kind: "ended"; answer: AnswerEntry }
  | { kind: "not-sent"; message: string };

export async function askLead(options: {
  client: EngineClient;
  request: ExactRequest;
}): Promise<LeadAnswer> {
  const { client } = options;
  const ended = Promise.withResolvers<LeadAnswer>();
  let answerId: string | undefined;
  const stopListening = client.events.listen((event) => {
    if (event.type !== "chat-changed" || event.entry.kind !== "answer") return;
    const { entry } = event;
    if (answerId === undefined && entry.state === "running")
      answerId = entry.id;
    if (entry.id !== answerId || entry.state === "running") return;
    ended.resolve({ kind: "ended", answer: entry });
  });
  try {
    const asked = await chatRequestsOf(client).ask(askInputOf(options.request));
    if (!asked.ok) {
      return { kind: "not-sent", message: failureTextOf(asked.failure) };
    }
    return await ended.promise;
  } finally {
    stopListening();
  }
}
