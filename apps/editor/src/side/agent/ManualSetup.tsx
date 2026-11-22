import { useState } from "react";
import type { AgentId, ServerCommand } from "./agentRequests.js";
import { commandLineOf, manualSetups } from "./agentTexts.js";
import { CopyBlock } from "./CopyBlock.js";

function ManualBlocks(props: { serverCommand: ServerCommand }) {
  const [setupId, setSetupId] = useState<AgentId>("claude-code");
  const setup =
    manualSetups.find((candidate) => candidate.id === setupId) ??
    manualSetups[0];
  return (
    <>
      <p className="fact">
        Your agent starts this command. It serves the tools of this project.
      </p>
      <CopyBlock
        text={commandLineOf([
          props.serverCommand.command,
          ...props.serverCommand.args,
        ])}
        copyLabel="Copy the command"
      />
      <div className="segments" role="group" aria-label="Agent">
        {manualSetups.map((candidate) => (
          <button
            key={candidate.id}
            type="button"
            aria-pressed={candidate.id === setup?.id}
            onClick={() => {
              setSetupId(candidate.id);
            }}
          >
            {candidate.name}
          </button>
        ))}
      </div>
      {setup === undefined ? undefined : (
        <>
          <p className="fact">{setup.where}</p>
          <CopyBlock
            key={setup.id}
            text={setup.configuration(props.serverCommand)}
            copyLabel="Copy the configuration"
          />
        </>
      )}
    </>
  );
}

export function ManualSetup(props: { serverCommand: ServerCommand }) {
  const [isOpen, setOpen] = useState(false);
  return (
    <div className="group">
      <button
        type="button"
        className="agent-manual-head"
        aria-expanded={isOpen}
        onClick={() => {
          setOpen(!isOpen);
        }}
      >
        Set up by hand
      </button>
      {isOpen ? (
        <ManualBlocks serverCommand={props.serverCommand} />
      ) : undefined}
    </div>
  );
}
