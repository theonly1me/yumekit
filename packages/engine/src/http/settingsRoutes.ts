import { brainAgentIds } from "@yumekit/brain";
import { z } from "zod";
import { saveAgentSetting } from "../chat/agentSetting.js";
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

export const settingsRoutes: Route[] = [
  { method: "PUT", pattern: ["api", "settings", "agent"], handle: putAgent },
];
