import { useState } from "react";
import type { EngineClient } from "../engine/engineClient.js";
import { projectLengths } from "./homeApi.js";
import { PlatformChoices } from "./PlatformChoices.js";
import { RecentProjects } from "./RecentProjects.js";
import { agentLineOf, lengthLabelOf } from "./startTexts.js";
import { useStartChoices } from "./useStartChoices.js";

const examplePrompt =
  "A 30 second video that explains my app to new users. Friendly, with a voice and music.";

function actionLineOf(options: {
  start: ReturnType<typeof useStartChoices>;
}): string {
  const { start } = options;
  if (start.busy === "making") {
    return "yumekit makes the project folder and starts the AI.";
  }
  if (start.platformIds.length === 0) return "Pick at least one place first.";
  return start.home === undefined ? "" : agentLineOf(start.home.agents);
}

export function StartScreen(props: { client: EngineClient }) {
  const start = useStartChoices(props.client);
  const [isChangeShown, setChangeShown] = useState(false);
  const isEmpty = start.request.trim() === "";
  const canMake =
    !isEmpty && start.platformIds.length > 0 && start.busy === "idle";
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
          <textarea
            id="start-prompt"
            rows={3}
            maxLength={4_000}
            placeholder={examplePrompt}
            value={start.request}
            onChange={(event) => {
              start.setRequest(event.target.value);
            }}
          />
          <div className="start-group">
            <h2>Where will it go?</h2>
            <p className="fact">
              Pick one or more. You get one video for each, in its own shape.
            </p>
            <PlatformChoices
              chosen={start.platformIds}
              onToggle={start.togglePlatform}
            />
          </div>
          <div className="start-group">
            <h2>How long?</h2>
            <div className="segments" role="group" aria-label="Length">
              {projectLengths.map((length) => (
                <button
                  type="button"
                  key={length}
                  aria-pressed={start.length === length}
                  onClick={() => {
                    start.setLength(length);
                  }}
                >
                  {lengthLabelOf(length)}
                </button>
              ))}
            </div>
          </div>
          <div className="start-action">
            <button
              type="submit"
              className="primary large"
              disabled={!canMake}
              aria-busy={start.busy === "making"}
            >
              {start.busy === "making"
                ? "Making the project"
                : "Make the video"}
            </button>
            <p className="fact">
              {actionLineOf({ start })}{" "}
              {start.busy === "making" ? undefined : (
                <button
                  type="button"
                  className="link"
                  aria-expanded={isChangeShown}
                  onClick={() => {
                    setChangeShown(!isChangeShown);
                  }}
                >
                  Change
                </button>
              )}
            </p>
            {isChangeShown ? (
              <p className="fact">
                You can pick another AI in Settings of the editor, after the
                project opens.
              </p>
            ) : undefined}
            {start.makeFailure === undefined ? undefined : (
              <p className="fact change-failure" role="alert">
                {start.makeFailure}
              </p>
            )}
            {start.busy === "making" ? (
              <div className="progress small" aria-hidden="true">
                <i />
              </div>
            ) : undefined}
          </div>
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
