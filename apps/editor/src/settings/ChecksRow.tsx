import { useState } from "react";
import type { EngineClient } from "../engine/engineClient.js";
import { changeProject } from "../scenes/directChange.js";
import { checkChoices, type CheckModeId } from "./checkModes.js";
import "../videoStyle/videoStyle.css";

export function ChecksRow(props: {
  client: EngineClient;
  checks: CheckModeId | undefined;
}) {
  const [picked, setPicked] = useState<CheckModeId>();
  const [failure, setFailure] = useState<string>();
  const shown = picked ?? props.checks ?? "draft";
  const choose = (checks: CheckModeId) => {
    if (checks === shown) return;
    setPicked(checks);
    setFailure(undefined);
    changeProject({
      client: props.client,
      name: "set_checks",
      input: { checks },
    })
      .then((outcome) => {
        if (outcome.kind === "failed") {
          setFailure(`The checks did not change. ${outcome.message}`);
        }
      })
      .catch(() => {
        setFailure("The checks did not change. Try again.");
      })
      .finally(() => {
        setPicked(undefined);
      });
  };
  return (
    <div className="setting-row look-row">
      <span>
        Checks
        <em>
          How the AI checks the pictures and the clips of a film. A change of
          design always stops a picture.
        </em>
      </span>
      <div
        className="style-choices"
        role="group"
        aria-label="How the AI checks the film"
      >
        {checkChoices.map((choice) => (
          <button
            type="button"
            className="style-choice"
            key={choice.id}
            aria-pressed={shown === choice.id}
            onClick={() => {
              choose(choice.id);
            }}
          >
            <span className="style-choice-name">{choice.name}</span>
            <em>{choice.line}</em>
          </button>
        ))}
      </div>
      {failure === undefined ? undefined : (
        <p className="fact change-failure" role="alert">
          {failure}
        </p>
      )}
    </div>
  );
}
