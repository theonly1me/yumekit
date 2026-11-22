import {
  brainAgentIds,
  createClaudeCodeAdapter,
  createCodexAdapter,
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

function isBrainAgentId(agentId: AgentId): agentId is BrainAgentId {
  return brainAgentIds.some((brainAgentId) => brainAgentId === agentId);
}

function adapterOf(options: {
  agentId: BrainAgentId;
  programPath: string;
}): AgentAdapter {
  return options.agentId === "claude-code"
    ? createClaudeCodeAdapter({ programPath: options.programPath })
    : createCodexAdapter({ programPath: options.programPath });
}

const noAgentInstalled: ChatFailure = {
  kind: "no-agent",
  message:
    "No AI program is on this computer. Install Claude Code or Codex, start it once in a terminal, and sign in.",
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
  if (agent !== undefined && !isBrainAgentId(agent)) {
    return {
      ok: false,
      failure: {
        kind: "no-agent",
        message: `The chat cannot use ${agentCatalog[agent].name} yet. Pick Claude Code or Codex in Settings.`,
      },
    };
  }
  const candidates = agent === undefined ? brainAgentIds : [agent];
  for (const agentId of candidates) {
    const programPath = agentPrograms?.[agentId] ?? programs[agentId];
    if (programPath !== undefined)
      return { ok: true, value: adapterOf({ agentId, programPath }) };
  }
  return { ok: false, failure: noAgentInstalled };
}
