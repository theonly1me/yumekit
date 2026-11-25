import { useId } from "react";
import type { EngineClient } from "../../engine/engineClient.js";
import type { AiRole } from "./aiModelRequests.js";
import { choicesHelpOf } from "./aiModelTexts.js";
import { RoleChoiceRow } from "./RoleChoiceRow.js";
import { useAiModels } from "./useAiModels.js";
import "./aiModels.css";

export function AiModels(props: {
  client: EngineClient;
  agentId: string | undefined;
  roles: readonly AiRole[];
}) {
  const { state, save } = useAiModels(props.client);
  const modelListId = useId();
  if (state.kind === "failed") {
    return <p className="fact">{state.message}</p>;
  }
  const agent =
    state.kind === "ready"
      ? state.agents.find((entry) => entry.id === props.agentId)
      : undefined;
  if (agent === undefined) return null;
  const isLeadShown = props.roles.includes("lead");
  return (
    <div className="ai-models">
      {isLeadShown ? (
        <>
          <h4>How {agent.name} thinks</h4>
          <p className="fact">
            {choicesHelpOf({
              programName: agent.name,
              hasEfforts: agent.efforts.length > 0,
            })}
          </p>
        </>
      ) : undefined}
      <datalist id={modelListId}>
        {agent.models.map((model) => (
          <option key={model} value={model} />
        ))}
      </datalist>
      <ul
        className="setting-rows"
        aria-label={
          isLeadShown
            ? "The model and effort of the AI"
            : "The model and effort of the AI that checks the work"
        }
      >
        {props.roles.map((role) => (
          <RoleChoiceRow
            key={`${agent.id}-${role}`}
            agent={agent}
            role={role}
            modelListId={modelListId}
            onSave={save}
          />
        ))}
      </ul>
    </div>
  );
}
