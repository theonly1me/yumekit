import { z } from "zod";
import type { EngineClient } from "../../engine/engineClient.js";

const choiceSchema = z.object({
  model: z.string().optional(),
  effort: z.string().optional(),
});

const agentModelsSchema = z.object({
  id: z.string(),
  name: z.string(),
  models: z.array(z.string()),
  efforts: z.array(z.string()),
  lead: choiceSchema,
  critic: choiceSchema,
});

export const aiRoles = ["lead", "critic"] as const;

export type AiRole = (typeof aiRoles)[number];
export type ModelChoice = z.infer<typeof choiceSchema>;
export type AgentModels = z.infer<typeof agentModelsSchema>;

export function aiModelRequests(client: EngineClient) {
  return {
    list: () =>
      client.readJson({
        path: "/api/settings/ai-models",
        schema: z.object({ agents: z.array(agentModelsSchema) }),
      }),
    save: (options: { agent: string; role: AiRole; choice: ModelChoice }) =>
      client.readJson({
        path: "/api/settings/ai-models",
        method: "PUT",
        schema: agentModelsSchema,
        body: {
          agent: options.agent,
          role: options.role,
          model: options.choice.model ?? null,
          effort: options.choice.effort ?? null,
        },
      }),
  };
}
