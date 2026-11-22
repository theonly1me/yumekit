import type { EngineClient } from "../../engine/engineClient.js";
import { AgentRow } from "./AgentRow.js";
import { promptOf } from "./agentTexts.js";
import { CopyBlock } from "./CopyBlock.js";
import { ManualSetup } from "./ManualSetup.js";
import { useAgents } from "./useAgents.js";
import "./agent.css";

function connectedText(connected: number): string {
  if (connected === 0) return "No agent is connected yet.";
  if (connected === 1) return "An agent is connected.";
  return `${String(connected)} agents are connected.`;
}

export function AgentPane(props: {
  client: EngineClient;
  projectFolder: string;
}) {
  const { state, connects, connect } = useAgents(props.client);
  if (state.kind === "loading") {
    return <p className="fact">Reading the agents.</p>;
  }
  if (state.kind === "failed") {
    return (
      <p className="failure" role="alert">
        {state.message}
      </p>
    );
  }
  const { agents, connected, serverCommand } = state.agents;
  const foundFirst = [
    ...agents.filter((agent) => agent.installed),
    ...agents.filter((agent) => !agent.installed),
  ];
  return (
    <div className="agent-pane">
      <p className="agent-state" data-connected={connected > 0} role="status">
        {connectedText(connected)}
      </p>
      <ul className="agent-list" aria-label="Agents">
        {foundFirst.map((agent) => (
          <AgentRow
            key={agent.id}
            agent={agent}
            projectFolder={props.projectFolder}
            connectState={connects[agent.id] ?? { kind: "idle" }}
            onConnect={() => {
              connect(agent.id).catch(() => undefined);
            }}
          />
        ))}
      </ul>
      <div className="group">
        <h3>Or give this to an agent that already runs</h3>
        <CopyBlock
          text={promptOf({ serverCommand, projectFolder: props.projectFolder })}
          copyLabel="Copy the prompt"
        />
      </div>
      <ManualSetup serverCommand={serverCommand} />
    </div>
  );
}
