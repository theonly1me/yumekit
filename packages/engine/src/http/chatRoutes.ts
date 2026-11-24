import { z } from "zod";
import type { ChatFailure } from "../chat/chatTypes.js";
import { anySegment, type Exchange, type Route } from "./exchange.js";
import { helperTokenOf } from "./helperCalls.js";
import { agentClient, clientHeader } from "./projectRoutes.js";
import { readJsonBody } from "./readJsonBody.js";
import { sendJson, type Failure } from "./responses.js";

const requestBodySchema = z.strictObject({
  text: z.string().trim().min(1).max(20_000),
  details: z.string().trim().min(1).max(20_000).optional(),
  about_clip_id: z.string().min(1).max(200).nullable().optional(),
});

function httpFailureOf(failure: ChatFailure): Failure {
  const isMissing =
    failure.kind === "clip-not-found" || failure.kind === "change-not-found";
  return { status: isMissing ? 404 : 409, ...failure };
}

async function readChat(exchange: Exchange) {
  sendJson({
    response: exchange.response,
    status: 200,
    body: await exchange.context.chat.view(),
  });
  return undefined;
}

function isAgentCall(exchange: Exchange): boolean {
  return (
    exchange.request.headers[clientHeader] === agentClient ||
    helperTokenOf(exchange) !== undefined
  );
}

async function startRequest(exchange: Exchange) {
  if (isAgentCall(exchange)) {
    return {
      status: 403,
      kind: "message-not-for-the-ai",
      message: "Only the person can send a message to the chat.",
    };
  }
  const body = await readJsonBody({
    request: exchange.request,
    schema: requestBodySchema,
  });
  if (!body.ok) return body.failure;
  const started = await exchange.context.chat.startRequest({
    text: body.value.text,
    details: body.value.details,
    aboutClipId: body.value.about_clip_id ?? undefined,
  });
  if (!started.ok) return httpFailureOf(started.failure);
  sendJson({ response: exchange.response, status: 202, body: started.value });
  return undefined;
}

function stop(exchange: Exchange) {
  const stopped = exchange.context.chat.stop();
  sendJson({ response: exchange.response, status: 200, body: { stopped } });
  return Promise.resolve(undefined);
}

async function undoChange(exchange: Exchange) {
  const [changeId = ""] = exchange.parameters;
  const undone = await exchange.context.chat.undoChange(changeId);
  if (!undone.ok) return httpFailureOf(undone.failure);
  sendJson({ response: exchange.response, status: 200, body: undone.value });
  return undefined;
}

export const chatRoutes: Route[] = [
  { method: "GET", pattern: ["api", "chat"], handle: readChat },
  {
    method: "POST",
    pattern: ["api", "chat", "requests"],
    handle: startRequest,
  },
  { method: "POST", pattern: ["api", "chat", "stop"], handle: stop },
  {
    method: "POST",
    pattern: ["api", "chat", "changes", anySegment, "undo"],
    handle: undoChange,
  },
];
