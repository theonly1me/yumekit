export const agentIds = ["claude-code", "codex", "cursor"] as const;

export type AgentId = (typeof agentIds)[number];

export function isAgentId(value: string): value is AgentId {
  return agentIds.some((agentId) => agentId === value);
}

export interface ServerCommand {
  command: string;
  args: string[];
}

export interface AgentRecord {
  id: AgentId;
  name: string;
  installed: boolean;
  configured: boolean;
  start_command: string;
  configuration_file: string;
}

export type ConnectFailure =
  | { kind: "configuration-not-readable"; file: string; message: string }
  | { kind: "configuration-not-valid"; file: string; message: string }
  | { kind: "configuration-not-written"; file: string; message: string };

export const serverName = "yumekit";
