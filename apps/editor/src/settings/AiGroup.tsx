import { useEffect, useState } from "react";
import type { Chat } from "../chat/useChat.js";
import type { EngineClient } from "../engine/engineClient.js";
import type { Agent } from "../side/agent/agentRequests.js";
import { useAgents } from "../side/agent/useAgents.js";
import { AiModels } from "./aiModels/AiModels.js";

const planText = "Uses the plan you already pay for.";

function noteOf(options: { agent: Agent; chat: Chat }): string {
  const { agent, chat } = options;
  if (!agent.installed) return "Install it, then open Settings again.";
  const signIn = chat.agent?.id === agent.id ? chat.agent.signIn : "unknown";
  if (signIn === "signed-out") {
    const signInStep =
      agent.id === "cursor"
        ? `Open a terminal and run ${agent.start_command} login.`
        : `Open a terminal, run ${agent.start_command} once, and sign in.`;
    return `Found on this computer. Not signed in. ${signInStep}`;
  }
  return signIn === "signed-in"
    ? `Found on this computer. Signed in. ${planText}`
    : `Found on this computer. ${planText}`;
}

function AgentChoice(props: { agent: Agent; chat: Chat; onUse: () => void }) {
  const { agent } = props;
  if (!agent.installed) {
    return <span className="fact">Not found on this computer</span>;
  }
  if (props.chat.agent?.id === agent.id) {
    return <span className="in-use">In use</span>;
  }
  return (
    <button
      type="button"
      aria-label={`Use ${agent.name}`}
      onClick={props.onUse}
    >
      Use this
    </button>
  );
}

export function AiGroup(props: { client: EngineClient; chat: Chat }) {
  const { state } = useAgents(props.client);
  const [failure, setFailure] = useState<string>();
  const { reload } = props.chat;
  useEffect(reload, [reload]);
  return (
    <section className="setting-group" aria-labelledby="ai-title">
      <h3 id="ai-title">Who makes the film</h3>
      <p className="fact">
        The lead is an AI app on this computer. It writes the story and makes
        the film with you.
      </p>
      {state.kind === "ready" ? (
        <ul className="setting-rows" aria-label="AI apps">
          {state.agents.agents.map((agent) => (
            <li key={agent.id} className="setting-row">
              <span>
                {agent.name}
                <em>{noteOf({ agent, chat: props.chat })}</em>
              </span>
              <AgentChoice
                agent={agent}
                chat={props.chat}
                onUse={() => {
                  props.chat.chooseAgent(agent.id).then(setFailure, () => {
                    setFailure("yumekit could not save the choice.");
                  });
                }}
              />
            </li>
          ))}
        </ul>
      ) : (
        <p className="fact">
          {state.kind === "failed" ? state.message : "Reading the AI apps."}
        </p>
      )}
      {failure === undefined ? undefined : (
        <p className="failure" role="alert">
          {failure}
        </p>
      )}
      <AiModels
        client={props.client}
        agentId={props.chat.agent?.id}
        roles={["lead"]}
      />
    </section>
  );
}
