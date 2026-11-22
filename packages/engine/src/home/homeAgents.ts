import { isOnPath } from "../agents/agentFiles.js";
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

async function isInstalled(options: {
  agentId: AgentId;
  programs: AgentPrograms;
}): Promise<boolean> {
  const { agentId, programs } = options;
  if (agentId === "cursor") return isOnPath(agentCatalog.cursor.program);
  return programs[agentId] !== undefined;
}

export async function listHomeAgents(
  programs: AgentPrograms,
): Promise<HomeAgent[]> {
  const chosen = await chooseAgent(programs);
  const inUse = chosen.ok ? chosen.value : undefined;
  const signIn = inUse === undefined ? null : await inUse.signInState();
  return Promise.all(
    agentIds.map(async (agentId) => {
      const isInUse = inUse?.id === agentId;
      return {
        id: agentId,
        name: agentCatalog[agentId].name,
        installed: isInUse || (await isInstalled({ agentId, programs })),
        in_use: isInUse,
        sign_in: isInUse ? signIn : null,
      };
    }),
  );
}
