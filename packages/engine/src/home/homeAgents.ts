import { agentCatalog } from "../agents/agentCatalog.js";
import { agentIds, type AgentId } from "../agents/agentTypes.js";
import { chooseAgent, type AgentPrograms } from "../chat/agentChoice.js";

export interface HomeAgent {
  id: AgentId;
  name: string;
  installed: boolean;
  in_use: boolean;
  sign_in: "signed-in" | "signed-out" | "unknown" | null;
}

function isInstalled(options: {
  agentId: AgentId;
  programs: AgentPrograms;
}): boolean {
  return options.programs[options.agentId] !== undefined;
}

export async function listHomeAgents(
  programs: AgentPrograms,
): Promise<HomeAgent[]> {
  const chosen = await chooseAgent(programs);
  const inUse = chosen.ok ? chosen.value : undefined;
  const signIn = inUse === undefined ? null : await inUse.signInState();
  return agentIds.map((agentId) => {
    const isInUse = inUse?.id === agentId;
    return {
      id: agentId,
      name: agentCatalog[agentId].name,
      installed: isInUse || isInstalled({ agentId, programs }),
      in_use: isInUse,
      sign_in: isInUse ? signIn : null,
    };
  });
}
