import {
  readKeyStates,
  removeKey,
  saveKey,
  type CheckKeyFailure,
  type KeyFailure,
} from "@yumekit/tools";
import { z } from "zod";
import { anySegment, type Exchange, type Route } from "./exchange.js";
import { readJsonBody } from "./readJsonBody.js";
import { sendJson, type Failure } from "./responses.js";

const keyBodySchema = z.strictObject({ value: z.string() });

function keyFailureOf(failure: KeyFailure): Failure {
  return {
    status: failure.kind === "key-not-valid" ? 400 : 500,
    kind: failure.kind,
    message: failure.message,
  };
}

function checkFailureOf(failure: CheckKeyFailure): Failure {
  const isMissing =
    failure.kind === "server-not-found" || failure.kind === "no-check-key-tool";
  return {
    status: isMissing ? 404 : 502,
    kind: failure.kind,
    message:
      "message" in failure
        ? failure.message
        : `The key check of "${failure.server}" failed with ${failure.kind}.`,
  };
}

async function sendKeyState(options: {
  exchange: Exchange;
  variable: string;
  extra: Record<string, boolean>;
}): Promise<undefined> {
  const [state] = await readKeyStates({ variables: [options.variable] });
  options.exchange.context.events.send({ type: "media-servers-changed" });
  sendJson({
    response: options.exchange.response,
    status: 200,
    body: { ...options.extra, ...state },
  });
  return undefined;
}

async function putKey(exchange: Exchange) {
  const [variable = ""] = exchange.parameters;
  const body = await readJsonBody({
    request: exchange.request,
    schema: keyBodySchema,
  });
  if (!body.ok) return body.failure;
  const saved = await saveKey({ variable, value: body.value.value });
  if (!saved.ok) return keyFailureOf(saved.failure);
  return sendKeyState({ exchange, variable, extra: {} });
}

async function deleteKey(exchange: Exchange) {
  const [variable = ""] = exchange.parameters;
  const removed = await removeKey({ variable });
  if (!removed.ok) return keyFailureOf(removed.failure);
  return sendKeyState({
    exchange,
    variable,
    extra: { removed: removed.value.removed },
  });
}

async function checkKey(exchange: Exchange) {
  const [server = ""] = exchange.parameters;
  const checked = await exchange.context.mediaTools.checkKey(server);
  if (!checked.ok) return checkFailureOf(checked.failure);
  sendJson({
    response: exchange.response,
    status: 200,
    body: { valid: checked.value.valid, message: checked.value.message },
  });
  return undefined;
}

export const keyRoutes: Route[] = [
  { method: "PUT", pattern: ["api", "keys", anySegment], handle: putKey },
  { method: "DELETE", pattern: ["api", "keys", anySegment], handle: deleteKey },
  {
    method: "POST",
    pattern: ["api", "keys", anySegment, "check"],
    handle: checkKey,
  },
];
