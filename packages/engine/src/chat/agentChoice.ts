import {
  brainAgentIds,
  createClaudeCodeAdapter,
  createCodexAdapter,
  createCursorAdapter,
  findProgram,
  type AgentAdapter,
  type AgentId as BrainAgentId,
} from "@yumekit/brain";
import { agentCatalog } from "../agents/agentCatalog.js";
import type { AgentId } from "../agents/agentTypes.js";
import type { Outcome } from "../engineTypes.js";
import type { ChatFailure } from "./chatTypes.js";
import { readChatSettings } from "./settings.js";

export type AgentPrograms = Partial<Record<BrainAgentId, string>>;

export async function findAgentPrograms(): Promise<AgentPrograms> {
  const programs: AgentPrograms = {};
  for (const agentId of brainAgentIds) {
    const found = await findProgram({
      program: agentCatalog[agentId].program,
      searchPath: process.env["PATH"] ?? "",
    });
    if (found !== undefined) programs[agentId] = found;
  }
  return programs;
}

function adapterOf(options: {
  agentId: AgentId;
  programPath: string;
}): AgentAdapter {
  const { programPath } = options;
  switch (options.agentId) {
    case "claude-code":
      return createClaudeCodeAdapter({ programPath });
    case "codex":
      return createCodexAdapter({ programPath });
    case "cursor":
      return createCursorAdapter({ programPath });
  }
}

const noAgentInstalled: ChatFailure = {
  kind: "no-agent",
  message:
    "No AI program is on this computer. Install Claude Code, Codex, or Cursor, start it once in a terminal, and sign in.",
};

export async function chooseAgent(
  programs: AgentPrograms,
): Promise<Outcome<AgentAdapter, ChatFailure>> {
  const settings = await readChatSettings();
  if (!settings.ok) {
    return {
      ok: false,
      failure: {
        kind: "settings-not-valid",
        message: `The settings file ${settings.failure.file} is not valid. Correct it or remove it.`,
      },
    };
  }
  const { agent, agentPrograms } = settings.value;
  const candidates = agent === undefined ? brainAgentIds : [agent];
  for (const agentId of candidates) {
    const programPath = agentPrograms?.[agentId] ?? programs[agentId];
    if (programPath !== undefined)
      return { ok: true, value: adapterOf({ agentId, programPath }) };
  }
  return { ok: false, failure: noAgentInstalled };
}
