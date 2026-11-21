import { useState } from "react";
import { agentClients, mcpCommandOf } from "./agentClients.js";
import { CopyBlock } from "./CopyBlock.js";

export function AgentPane(props: { projectFolder: string }) {
  const [clientId, setClientId] = useState(agentClients[0]?.id);
  const client =
    agentClients.find((candidate) => candidate.id === clientId) ??
    agentClients[0];
  return (
    <>
      <h2>Connect an agent</h2>
      <p className="fact">
        An agent builds this project with the yumekit tools. Each change it
        makes shows here at once.
      </p>
      <div className="group">
        <h3>The command</h3>
        <p className="fact">
          Your agent starts this command. It serves the tools of this project.
        </p>
        <CopyBlock
          text={mcpCommandOf(props.projectFolder)}
          copyLabel="Copy the command"
        />
      </div>
      <div className="group">
        <h3>Configuration for your agent</h3>
        <div className="switch" role="group" aria-label="Agent">
          {agentClients.map((candidate) => (
            <button
              key={candidate.id}
              type="button"
              aria-pressed={candidate.id === client?.id}
              onClick={() => {
                setClientId(candidate.id);
              }}
            >
              {candidate.name}
            </button>
          ))}
        </div>
        {client === undefined ? undefined : (
          <>
            <p className="fact">{client.where}</p>
            <CopyBlock
              key={client.id}
              text={client.configuration(props.projectFolder)}
              copyLabel="Copy the configuration"
            />
          </>
        )}
      </div>
    </>
  );
}
