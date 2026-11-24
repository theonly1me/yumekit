import {
  choiceCapabilities,
  type ChoiceService,
  type CurrentPick,
  type MediaChoices,
  type MediaPickFailure,
} from "@yumekit/tools";
import { z } from "zod";
import type { Exchange, Route } from "./exchange.js";
import { readJsonBody } from "./readJsonBody.js";
import { sendJson, type Failure } from "./responses.js";

const pickBodySchema = z.union([
  z.strictObject({
    capability: z.enum(choiceCapabilities),
    server: z.string().min(1),
    model: z.string().min(1).optional(),
  }),
  z.strictObject({ capability: z.enum(choiceCapabilities) }),
]);

const pickFailureStatus: Record<MediaPickFailure["kind"], number> = {
  "server-not-found": 404,
  "no-server-for-capability": 400,
  "model-not-found": 400,
  "invalid-configuration-file": 409,
  "configuration-not-written": 500,
};

function pickFailureOf(failure: MediaPickFailure): Failure {
  const message =
    "message" in failure
      ? failure.message
      : failure.kind === "server-not-found"
        ? `No media server has the name "${failure.server}".`
        : `The server "${failure.server}" does not make ${failure.capability}.`;
  return {
    status: pickFailureStatus[failure.kind],
    kind: failure.kind,
    message,
  };
}

function wireServiceOf(service: ChoiceService) {
  return {
    server: service.server,
    label: service.label,
    state: service.state,
    key_problem: service.keyProblem ?? null,
    keys: service.keys,
    models: service.models.map((model) => ({
      id: model.id,
      label: model.label,
      is_default: model.isDefault,
      download: model.download ?? null,
    })),
  };
}

function wireCurrentOf(current: CurrentPick) {
  return {
    server: current.server,
    server_label: current.serverLabel,
    model: current.model ?? null,
    model_label: current.modelLabel ?? null,
    source: current.source,
    state: current.state,
  };
}

function wireChoicesOf(choices: MediaChoices) {
  return {
    choices: choices.choices.map((choice) => ({
      capability: choice.capability,
      current:
        choice.current === undefined ? null : wireCurrentOf(choice.current),
      services: choice.services.map(wireServiceOf),
    })),
    failed_servers: choices.failedServers,
  };
}

async function getChoices(exchange: Exchange) {
  await exchange.context.mediaTools.checkKeys();
  const choices = await exchange.context.mediaTools.choices();
  sendJson({
    response: exchange.response,
    status: 200,
    body: wireChoicesOf(choices),
  });
  return undefined;
}

async function putDefault(exchange: Exchange) {
  const body = await readJsonBody({
    request: exchange.request,
    schema: pickBodySchema,
  });
  if (!body.ok) return body.failure;
  const pick = body.value;
  const picked = await exchange.context.mediaTools.pick(
    "server" in pick
      ? {
          capability: pick.capability,
          server: pick.server,
          ...(pick.model === undefined ? {} : { model: pick.model }),
        }
      : { capability: pick.capability },
  );
  if (!picked.ok) return pickFailureOf(picked.failure);
  exchange.context.events.send({ type: "media-servers-changed" });
  sendJson({
    response: exchange.response,
    status: 200,
    body: wireChoicesOf(picked.value),
  });
  return undefined;
}

export const mediaChoiceRoutes: Route[] = [
  { method: "GET", pattern: ["api", "media", "choices"], handle: getChoices },
  { method: "PUT", pattern: ["api", "media", "defaults"], handle: putDefault },
];
