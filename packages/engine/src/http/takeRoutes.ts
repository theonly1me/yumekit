import { takeNoteInput, takeNoteOf } from "@yumekit/harness-mcp";
import {
  approvePicturesFirstOf,
  chaptersOf,
  reviewCountsOf,
} from "@yumekit/project";
import { z } from "zod";
import { exportApprovedFilm } from "../exports/approvedFilm.js";
import { removeTakeDraft } from "../takeDrafts/takeDraftFile.js";
import { isAgentCall } from "./chatRoutes.js";
import { anySegment, type Exchange, type Route } from "./exchange.js";
import { readJsonBody } from "./readJsonBody.js";
import { sendJson, type Failure } from "./responses.js";
import {
  fewerRequestOf,
  sendNextSchema,
  sendSummaryOf,
} from "./takeSendTexts.js";

const sendBodySchema = z.strictObject({
  notes: z.array(takeNoteInput).max(500).default([]),
  next: sendNextSchema,
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
  const { notes, next } = body.value;
  const { storyPlan } = context.store.read().bible;
  const sent = await context.chat.runToolCall({
    caller: {
      by: "person",
      tool: "send_take",
      summary: sendSummaryOf({
        take: context.store.read().takes.find((take) => take.id === takeId),
        storyPlan,
        counts: reviewCountsOf(notes.map(takeNoteOf)),
        next,
      }),
    },
    call: () => context.harness.sendTake({ takeId, notes }),
  });
  if (!sent.ok) {
    const { kind, message } = sent.failure;
    return { status: kind === "take-not-found" ? 404 : 409, kind, message };
  }
  await removeTakeDraft({
    projectFolder: context.projectFolder,
    draftId: takeId,
  });
  exportApprovedFilm({
    snapshot: context.store.read(),
    take: sent.value.take,
    exports: context.chat.exports,
  });
  if (next === "stop") {
    sendJson({
      response: exchange.response,
      status: 202,
      body: { take: sent.value.take, entry: null },
    });
    return undefined;
  }
  const fewer =
    next === "fewer"
      ? await fewerRequestOf({
          take: sent.value.take,
          storyPlan,
          mediaTools: context.mediaTools,
        })
      : undefined;
  const started = await context.chat.startRequest({
    text: fewer?.text ?? sent.value.text,
    details:
      fewer === undefined
        ? sent.value.details
        : `${sent.value.details}\n${fewer.line}`,
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
