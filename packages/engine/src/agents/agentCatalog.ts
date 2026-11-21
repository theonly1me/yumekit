import type { AgentId } from "./agentTypes.js";
import type { ConfigurationFormat } from "./configurationFormat.js";
import { jsonFormat } from "./jsonFormat.js";
import { tomlFormat } from "./tomlFormat.js";

export interface AgentSpecification {
  id: AgentId;
  name: string;
  program: string;
  configurationPath: string[];
  format: ConfigurationFormat;
}

export const agentCatalog: Record<AgentId, AgentSpecification> = {
  "claude-code": {
    id: "claude-code",
    name: "Claude Code",
    program: "claude",
    configurationPath: [".mcp.json"],
    format: jsonFormat,
  },
  codex: {
    id: "codex",
    name: "Codex",
    program: "codex",
    configurationPath: [".codex", "config.toml"],
    format: tomlFormat,
  },
  cursor: {
    id: "cursor",
    name: "Cursor",
    program: "cursor-agent",
    configurationPath: [".cursor", "mcp.json"],
    format: jsonFormat,
  },
};
