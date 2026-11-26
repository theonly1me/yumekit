import { useState } from "react";
import type { ChatAgent } from "../../chat/chatSchemas.js";
import type { EngineClient } from "../../engine/engineClient.js";
import type { LeadAccess, LeadAccessChoice } from "./leadAccessRequests.js";
import { LeadFolders } from "./LeadFolders.js";
import { LeadRules } from "./LeadRules.js";
import { useLeadAccess, type LeadAccessActions } from "./useLeadAccess.js";
import "./leadAccess.css";

const choiceLabels: Record<LeadAccessChoice, string> = {
  "ask-me": "Ask me when it needs to",
  "yumekit-only": "Only yumekit's tools",
};

function explanationOf(options: {
  lead: LeadAccess;
  agent: ChatAgent | null | undefined;
}): string {
  const { lead, agent } = options;
  if (lead.access === "yumekit-only") {
    return "The lead only makes the film with yumekit. It cannot open a web page, run a command, or read your files.";
  }
  if (
    agent !== null &&
    agent !== undefined &&
    !lead.askingAgents.includes(agent.id)
  ) {
    return `${agent.name} cannot send its questions to yumekit, so with ${agent.name} the lead uses only yumekit's tools. Claude Code can ask you.`;
  }
  const program = agent?.name ?? "your AI app";
  return `The lead uses the tools of ${program} on this computer. It can open a web page, run a command, or record the screen. When it needs your yes, a card shows in the chat.`;
}

function ReadyLeadAccess(props: {
  lead: LeadAccess;
  actions: LeadAccessActions;
  agent: ChatAgent | null | undefined;
}) {
  const { lead, actions, agent } = props;
  const [failure, setFailure] = useState<string>();
  const run = (change: Promise<string | undefined>) => {
    change.then(setFailure, (error: unknown) => {
      setFailure(String(error));
    });
  };
  const canAsk =
    lead.access === "ask-me" &&
    (agent === null ||
      agent === undefined ||
      lead.askingAgents.includes(agent.id));
  return (
    <>
      <div className="segments" role="group" aria-label="What the lead may do">
        {(["ask-me", "yumekit-only"] as const).map((choice) => (
          <button
            key={choice}
            type="button"
            aria-pressed={lead.access === choice}
            onClick={() => {
              run(actions.choose(choice));
            }}
          >
            {choiceLabels[choice]}
          </button>
        ))}
      </div>
      <p className="fact">{explanationOf({ lead, agent })}</p>
      {failure === undefined ? undefined : (
        <p className="failure" role="alert">
          {failure}
        </p>
      )}
      {canAsk ? (
        <>
          <LeadFolders lead={lead} actions={actions} />
          <LeadRules lead={lead} actions={actions} />
        </>
      ) : undefined}
    </>
  );
}

export function LeadAccessGroup(props: {
  client: EngineClient;
  agent: ChatAgent | null | undefined;
}) {
  const actions = useLeadAccess(props.client);
  const { state } = actions;
  return (
    <section
      className="setting-group lead-access"
      aria-labelledby="lead-access-title"
    >
      <h3 id="lead-access-title">What the lead may do</h3>
      {state.kind === "ready" ? (
        <ReadyLeadAccess
          lead={state.lead}
          actions={actions}
          agent={props.agent}
        />
      ) : (
        <p className="fact">
          {state.kind === "failed"
            ? state.message
            : "Reading what the lead may do."}
        </p>
      )}
    </section>
  );
}
