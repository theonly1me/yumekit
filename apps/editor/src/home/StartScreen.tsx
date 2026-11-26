import { useEffect, useRef, useState } from "react";
import {
  AddFilesButton,
  DropHint,
  FileChips,
  useDropZone,
} from "../chat/files/index.js";
import type { EngineClient } from "../engine/engineClient.js";
import { RecentProjects } from "./RecentProjects.js";
import { StartPlaces } from "./StartPlaces.js";
import {
  agentProblemOf,
  longestRequestCharacters,
  requestLimitLineOf,
} from "./startTexts.js";
import {
  firstGapOf,
  howToLine,
  isGuideText,
  startTemplates,
  type StartTemplate,
} from "./templates.js";
import { useStartChoices } from "./useStartChoices.js";
import "./startBox.css";

export function StartScreen(props: { client: EngineClient }) {
  const start = useStartChoices(props.client);
  const drop = useDropZone(start.files.add);
  const box = useRef<HTMLTextAreaElement>(null);
  const [caret, setCaret] = useState<{ at: number }>();
  const canMake =
    start.request.trim() !== "" &&
    start.platformIds.length > 0 &&
    start.busy === "idle" &&
    !start.files.isAdding;
  const agentProblem =
    start.home === undefined ? undefined : agentProblemOf(start.home.agents);
  const limitLine = requestLimitLineOf(start.request.length);

  useEffect(() => {
    if (caret === undefined) return;
    box.current?.focus();
    box.current?.setSelectionRange(caret.at, caret.at);
  }, [caret]);

  const choose = (template: StartTemplate) => {
    const isSame = start.form === template.id;
    start.setForm(isSame ? undefined : template.id);
    if (!isGuideText(start.request)) return;
    const guide = isSame ? "" : template.guide;
    start.setRequest(guide);
    setCaret({ at: firstGapOf(guide) });
  };

  return (
    <main className="start">
      <div className="start-body">
        <p className="wordmark">yumekit</p>
        <form
          className="start-form"
          onSubmit={(event) => {
            event.preventDefault();
            if (canMake) start.make().catch(() => undefined);
          }}
        >
          <label className="start-question" htmlFor="start-prompt">
            What do you want to make?
          </label>
          <div className="template-chips" role="group" aria-label="Start from">
            {startTemplates.map((template) => (
              <button
                key={template.id}
                type="button"
                className="template-chip"
                aria-pressed={start.form === template.id}
                onClick={() => {
                  choose(template);
                }}
              >
                {template.name}
              </button>
            ))}
          </div>
          <div
            className="prompt-box"
            data-dragging={drop.isDragging}
            {...drop.zoneProps}
          >
            <textarea
              id="start-prompt"
              ref={box}
              rows={start.form === undefined ? 4 : 7}
              maxLength={longestRequestCharacters}
              placeholder="Describe it. A rough story is enough."
              value={start.request}
              onChange={(event) => {
                start.setRequest(event.target.value);
              }}
            />
            <FileChips
              files={start.files.items}
              onRemove={start.files.remove}
            />
            <div className="prompt-foot">
              <AddFilesButton onFiles={start.files.add} />
              <button
                type="submit"
                className="primary"
                disabled={!canMake}
                aria-busy={start.busy === "making"}
              >
                {start.busy === "making" ? "Making the project" : "Start"}
              </button>
            </div>
            <DropHint isShown={drop.isDragging} />
          </div>
          {limitLine === undefined ? undefined : (
            <p className="fact" role="status">
              {limitLine}
            </p>
          )}
          <p className="how-to">{howToLine}</p>
          <StartPlaces
            platformIds={start.platformIds}
            length={start.length}
            onToggle={start.togglePlatform}
            onLength={start.setLength}
          />
          {agentProblem === undefined ? undefined : (
            <p className="fact change-failure" role="alert">
              {agentProblem}
            </p>
          )}
          {start.makeFailure === undefined ? undefined : (
            <p className="fact change-failure" role="alert">
              {start.makeFailure}
            </p>
          )}
          {start.busy === "making" ? (
            <div className="start-action">
              <p className="fact">
                yumekit makes the project folder and starts the lead.
              </p>
              <div className="progress small" aria-hidden="true">
                <i />
              </div>
            </div>
          ) : undefined}
        </form>
        {start.loadFailure === undefined ? undefined : (
          <p className="fact change-failure" role="alert">
            {start.loadFailure}
          </p>
        )}
        <RecentProjects
          projects={start.home?.recent ?? []}
          isBusy={start.busy !== "idle"}
          failure={start.openFailure}
          onOpen={(folder) => {
            start.open(folder).catch(() => undefined);
          }}
        />
      </div>
    </main>
  );
}
