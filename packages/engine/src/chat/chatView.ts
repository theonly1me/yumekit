import { chooseAgent, type AgentPrograms } from "./agentChoice.js";
import type { ChatLog } from "./chatLog.js";
import type { ChatView } from "./chatTypes.js";
import type { RunState } from "./requestStart.js";

export async function chatViewOf(options: {
  programs: AgentPrograms;
  phase: RunState["phase"];
  log: ChatLog;
}): Promise<ChatView> {
  const chosen = await chooseAgent(options.programs);
  return {
    agent: chosen.ok
      ? {
          id: chosen.value.id,
          name: chosen.value.name,
          signIn: await chosen.value.signInState(),
        }
      : null,
    state: options.phase === "idle" ? "idle" : "running",
    entries: options.log.entries(),
  };
}
