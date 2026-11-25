import { takeNoteInput } from "@yumekit/harness-mcp";
import { approvePicturesFirstOf, chaptersOf } from "@yumekit/project";
import { z } from "zod";
import { isAgentCall } from "./chatRoutes.js";
import { anySegment, type Exchange, type Route } from "./exchange.js";
import { readJsonBody } from "./readJsonBody.js";
import { sendJson, type Failure } from "./responses.js";

const sendBodySchema = z.strictObject({
  notes: z.array(takeNoteInput).max(500).default([]),
});

function listTakes(exchange: Exchange): Promise<undefined> {
  const snapshot = exchange.context.store.read();
  sendJson({
    response: exchange.response,
    status: 200,
    body: {
      takes: snapshot.takes,
      chapters: chaptersOf(snapshot.bible.storyPlan),
      approvePicturesFirst: approvePicturesFirstOf(snapshot.project),
    },
  });
  return Promise.resolve(undefined);
}

function summaryOf(options: {
  exchange: Exchange;
  takeId: string;
  notes: number;
}): string {
  const take = options.exchange.context.store
    .read()
    .takes.find((candidate) => candidate.id === options.takeId);
  const name = take === undefined ? "a take" : `take ${String(take.number)}`;
  return options.notes === 0
    ? `You approved ${name}.`
    : `You sent ${name} with ${String(options.notes)} ${options.notes === 1 ? "note" : "notes"}.`;
}

async function sendTake(exchange: Exchange): Promise<Failure | undefined> {
  if (isAgentCall(exchange)) {
    return {
      status: 403,
      kind: "take-not-for-the-ai",
      message: "Only the person can send a take.",
    };
  }
  const body = await readJsonBody({
    request: exchange.request,
    schema: sendBodySchema,
  });
  if (!body.ok) return body.failure;
  const { context } = exchange;
  const [takeId = ""] = exchange.parameters;
  const { notes } = body.value;
  const sent = await context.chat.runToolCall({
    caller: {
      by: "person",
      tool: "send_take",
      summary: summaryOf({ exchange, takeId, notes: notes.length }),
    },
    call: () => context.harness.sendTake({ takeId, notes }),
  });
  if (!sent.ok) {
    const { kind, message } = sent.failure;
    return { status: kind === "take-not-found" ? 404 : 409, kind, message };
  }
  const started = await context.chat.startRequest({
    text: sent.value.text,
    details: sent.value.details,
    aboutClipId: undefined,
  });
  if (!started.ok) {
    return {
      status: 409,
      kind: started.failure.kind,
      message: `Your notes are saved. ${started.failure.message}`,
    };
  }
  sendJson({
    response: exchange.response,
    status: 202,
    body: { take: sent.value.take, entry: started.value },
  });
  return undefined;
}

export const takeRoutes: Route[] = [
  { method: "GET", pattern: ["api", "takes"], handle: listTakes },
  {
    method: "POST",
    pattern: ["api", "takes", anySegment, "send"],
    handle: sendTake,
  },
];
