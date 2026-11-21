import type { Agent } from "./agentRequests.js";
import { approvalNotes, startLineOf } from "./agentTexts.js";
import { CopyBlock } from "./CopyBlock.js";
import type { ConnectState } from "./useAgents.js";

export function AgentRow(props: {
  agent: Agent;
  projectFolder: string;
  connectState: ConnectState;
  onConnect: () => void;
}) {
  const { agent, connectState } = props;
  return (
    <li className="agent" data-found={agent.installed}>
      <div className="agent-head">
        <span className="agent-name">
          {agent.name}
          <em>
            {agent.installed
              ? "Found on this computer"
              : "Not found on this computer"}
          </em>
        </span>
        <button
          type="button"
          className={
            agent.installed && !agent.configured ? "primary" : undefined
          }
          aria-label={`Connect ${agent.name}`}
          disabled={connectState.kind === "connecting"}
          onClick={props.onConnect}
        >
          Connect
        </button>
      </div>
      {connectState.kind === "failed" ? (
        <p className="failure" role="alert">
          {connectState.message}
        </p>
      ) : undefined}
      {agent.configured ? (
        <div className="agent-detail">
          <p className="fact">
            The entry is in <strong>{agent.configuration_file}</strong>.{" "}
            {approvalNotes[agent.id]}
          </p>
          <p className="fact">Start {agent.name} in the project folder:</p>
          <CopyBlock
            text={startLineOf({
              projectFolder: props.projectFolder,
              startCommand: agent.start_command,
            })}
            copyLabel="Copy"
          />
        </div>
      ) : undefined}
    </li>
  );
}
