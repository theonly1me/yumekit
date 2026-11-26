import type { AgentId } from "./brainTypes.js";

export const permissionToolName = "ask_permission";

export const fileCheckToolName = "check_file_access";

export const leadToolNames: readonly string[] = [
  permissionToolName,
  fileCheckToolName,
];

export const askingAgentIds: readonly AgentId[] = ["claude-code"];
