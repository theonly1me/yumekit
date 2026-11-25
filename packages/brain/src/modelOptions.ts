import type { AgentId } from "./brainTypes.js";

export interface ModelOptions {
  models: readonly string[];
  efforts: readonly string[];
}

export const agentModelOptions: Record<AgentId, ModelOptions> = {
  "claude-code": {
    models: ["fable", "opus", "sonnet"],
    efforts: ["low", "medium", "high", "xhigh", "max"],
  },
  codex: {
    models: [],
    efforts: ["none", "minimal", "low", "medium", "high", "xhigh", "max"],
  },
  cursor: { models: ["auto"], efforts: [] },
};
