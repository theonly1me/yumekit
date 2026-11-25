import type { z } from "zod";
import type { ChatFailure, ChatFailureKind } from "../chat/chatTypes.js";
import type { PersonRequestInput } from "../chat/questions/personRequest.js";
import {
  answersBodySchema,
  answersInputOf,
  messageInputOf,
  requestBodySchema,
} from "./chatBodies.js";
import { anySegment, type Exchange, type Route } from "./exchange.js";
import { helperTokenOf } from "./helperCalls.js";
import { agentClient, clientHeader } from "./projectRoutes.js";
import { readJsonBody } from "./readJsonBody.js";
import { sendJson, type Failure } from "./responses.js";

const statusByKind: Partial<Record<ChatFailureKind, number>> = {
  "clip-not-found": 404,
  "change-not-found": 404,
  "file-not-found": 404,
  "answers-not-valid": 400,
};

function httpFailureOf(failure: ChatFailure): Failure {
  return { status: statusByKind[failure.kind] ?? 409, ...failure };
}

async function readChat(exchange: Exchange) {
  sendJson({
    response: exchange.response,
    status: 200,
    body: await exchange.context.chat.view(),
  });
  return undefined;
}

export function isAgentCall(exchange: Exchange): boolean {
  return (
    exchange.request.headers[clientHeader] === agentClient ||
    helperTokenOf(exchange) !== undefined
  );
}

function personMessageRoute<Body>(options: {
  schema: z.ZodType<Body>;
  inputOf: (body: Body) => PersonRequestInput;
}): Route["handle"] {
  return async (exchange) => {
    if (isAgentCall(exchange)) {
      return {
        status: 403,
        kind: "message-not-for-the-ai",
        message: "Only the person can send a message to the chat.",
      };
    }
    const body = await readJsonBody({
      request: exchange.request,
      schema: options.schema,
    });
    if (!body.ok) return body.failure;
    const started = await exchange.context.chat.startRequest(
      options.inputOf(body.value),
    );
    if (!started.ok) return httpFailureOf(started.failure);
    sendJson({ response: exchange.response, status: 202, body: started.value });
    return undefined;
  };
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
    handle: personMessageRoute({
      schema: requestBodySchema,
      inputOf: messageInputOf,
    }),
  },
  {
    method: "POST",
    pattern: ["api", "chat", "answers"],
    handle: personMessageRoute({
      schema: answersBodySchema,
      inputOf: answersInputOf,
    }),
  },
  { method: "POST", pattern: ["api", "chat", "stop"], handle: stop },
  {
    method: "POST",
    pattern: ["api", "chat", "changes", anySegment, "undo"],
    handle: undoChange,
  },
];
