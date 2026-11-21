import { z } from "zod";
import type { EngineClient } from "../../engine/engineClient.js";

const agentIdSchema = z.enum(["claude-code", "codex", "cursor"]);

const agentSchema = z.object({
  id: agentIdSchema,
  name: z.string(),
  installed: z.boolean(),
  configured: z.boolean(),
  start_command: z.string(),
  configuration_file: z.string(),
});

const serverCommandSchema = z.object({
  command: z.string(),
  args: z.array(z.string()),
});

const agentsSchema = z.object({
  agents: z.array(agentSchema),
  connected: z.number(),
  serverCommand: serverCommandSchema,
});

export type AgentId = z.infer<typeof agentIdSchema>;
export type Agent = z.infer<typeof agentSchema>;
export type Agents = z.infer<typeof agentsSchema>;
export type ServerCommand = z.infer<typeof serverCommandSchema>;

export function agentRequests(client: EngineClient) {
  return {
    list: () => client.readJson({ path: "/api/agents", schema: agentsSchema }),
    connect: (agentId: AgentId) =>
      client.readJson({
        path: `/api/agents/${encodeURIComponent(agentId)}/connect`,
        method: "POST",
        schema: agentSchema,
      }),
  };
}
