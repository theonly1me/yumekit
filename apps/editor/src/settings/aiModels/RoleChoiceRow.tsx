import { useState } from "react";
import type { AgentModels, AiRole, ModelChoice } from "./aiModelRequests.js";
import { effortLabelOf, roleTexts } from "./aiModelTexts.js";
import type { SaveChoice } from "./useAiModels.js";

function choiceWith(options: {
  choice: ModelChoice;
  model: string | undefined;
  effort: string | undefined;
}): ModelChoice {
  const { model, effort } = options;
  return {
    ...(model === undefined || model.trim() === ""
      ? {}
      : { model: model.trim() }),
    ...(effort === undefined || effort === "" ? {} : { effort }),
  };
}

export function RoleChoiceRow(props: {
  agent: AgentModels;
  role: AiRole;
  modelListId: string;
  onSave: SaveChoice;
}) {
  const { agent, role } = props;
  const choice = agent[role];
  const [draft, setDraft] = useState<string>();
  const [note, setNote] = useState<{ text: string; isFailure: boolean }>();
  const texts = roleTexts[role];
  const save = (next: ModelChoice) => {
    setNote(undefined);
    props
      .onSave({ agent: agent.id, role, choice: next })
      .then((failure) => {
        setDraft(undefined);
        setNote(
          failure === undefined
            ? { text: "Saved.", isFailure: false }
            : { text: `Not saved. ${failure}`, isFailure: true },
        );
      })
      .catch(() => {
        setNote({ text: "Not saved. Try again.", isFailure: true });
      });
  };
  const saveModel = () => {
    if (draft === undefined || draft.trim() === (choice.model ?? "")) return;
    save(choiceWith({ choice, model: draft, effort: choice.effort }));
  };
  return (
    <li className="setting-row role-choice">
      <span className="setting-name">
        {texts.name}
        <em>{texts.about}</em>
      </span>
      <div className="role-fields">
        <label className="role-field">
          <span>Model</span>
          <input
            type="text"
            list={props.modelListId}
            value={draft ?? choice.model ?? ""}
            placeholder={`${agent.name} picks`}
            aria-label={`${texts.name}: model`}
            spellCheck={false}
            autoComplete="off"
            onChange={(event) => {
              setNote(undefined);
              setDraft(event.target.value);
            }}
            onBlur={saveModel}
            onKeyDown={(event) => {
              if (event.key === "Enter") saveModel();
            }}
          />
        </label>
        {agent.efforts.length === 0 ? null : (
          <label className="role-field">
            <span>Effort</span>
            <select
              value={choice.effort ?? ""}
              aria-label={`${texts.name}: effort`}
              onChange={(event) => {
                save(
                  choiceWith({
                    choice,
                    model: draft ?? choice.model,
                    effort: event.target.value,
                  }),
                );
              }}
            >
              <option value="">{agent.name} decides</option>
              {agent.efforts.map((effort) => (
                <option key={effort} value={effort}>
                  {effortLabelOf(effort)}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>
      {note === undefined ? null : (
        <p
          className={note.isFailure ? "change-failure" : "limit-value"}
          role={note.isFailure ? "alert" : "status"}
        >
          {note.text}
        </p>
      )}
    </li>
  );
}
