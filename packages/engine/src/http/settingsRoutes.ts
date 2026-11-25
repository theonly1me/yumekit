import { brainAgentIds } from "@yumekit/brain";
import { z } from "zod";
import { saveAgentSetting } from "../chat/agentSetting.js";
import {
  readAiModels,
  saveAiModel,
  type ModelSettingFailure,
} from "../chat/modelSetting.js";
import { aiRoles } from "../chat/settings.js";
import type { Exchange, Route } from "./exchange.js";
import { readJsonBody } from "./readJsonBody.js";
import { sendJson } from "./responses.js";

const agentBodySchema = z.strictObject({ agent: z.enum(brainAgentIds) });

async function putAgent(exchange: Exchange) {
  const body = await readJsonBody({
    request: exchange.request,
    schema: agentBodySchema,
  });
  if (!body.ok) return body.failure;
  const saved = await saveAgentSetting(body.value.agent);
  if (!saved.ok) {
    const isNotValid = saved.failure.kind === "settings-not-valid";
    return { status: isNotValid ? 409 : 500, ...saved.failure };
  }
  sendJson({ response: exchange.response, status: 200, body: saved.value });
  return undefined;
}

const choiceText = z
  .string()
  .trim()
  .max(200)
  .nullable()
  .transform((text) => (text === null || text === "" ? undefined : text));

const modelBodySchema = z.strictObject({
  agent: z.enum(brainAgentIds),
  role: z.enum(aiRoles),
  model: choiceText,
  effort: choiceText,
});

function statusOf(failure: ModelSettingFailure): number {
  switch (failure.kind) {
    case "effort-not-known":
      return 400;
    case "settings-not-valid":
      return 409;
    default:
      return 500;
  }
}

async function readModels(exchange: Exchange) {
  const read = await readAiModels();
  if (!read.ok) return { status: statusOf(read.failure), ...read.failure };
  sendJson({
    response: exchange.response,
    status: 200,
    body: { agents: read.value },
  });
  return undefined;
}

async function putModel(exchange: Exchange) {
  const body = await readJsonBody({
    request: exchange.request,
    schema: modelBodySchema,
  });
  if (!body.ok) return body.failure;
  const saved = await saveAiModel(body.value);
  if (!saved.ok) return { status: statusOf(saved.failure), ...saved.failure };
  sendJson({ response: exchange.response, status: 200, body: saved.value });
  return undefined;
}

export const settingsRoutes: Route[] = [
  { method: "PUT", pattern: ["api", "settings", "agent"], handle: putAgent },
  {
    method: "GET",
    pattern: ["api", "settings", "ai-models"],
    handle: readModels,
  },
  {
    method: "PUT",
    pattern: ["api", "settings", "ai-models"],
    handle: putModel,
  },
];
