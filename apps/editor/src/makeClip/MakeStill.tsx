import { useState } from "react";
import type { EngineClient } from "../engine/engineClient.js";
import type { Asset, Output } from "../engine/snapshot.js";
import { makeStill } from "./makeClip.js";
import type { ModelChoice } from "./modelChoices.js";
import type { ToolFailure } from "./toolCalls.js";

type StillState =
  | { kind: "idle" }
  | { kind: "making" }
  | { kind: "failed"; failure: ToolFailure };

export function MakeStill(props: {
  client: EngineClient;
  choices: ModelChoice[];
  output: Output;
  assets: Asset[];
  sceneId: string;
  onMade: (assetId: string) => void;
}) {
  const { choices } = props;
  const [prompt, setPrompt] = useState("");
  const [chosenKey, setChosenKey] = useState<string>();
  const [state, setState] = useState<StillState>({ kind: "idle" });
  const [firstChoice] = choices;
  const choice =
    choices.find((candidate) => candidate.key === chosenKey) ?? firstChoice;

  if (choice === undefined) {
    return (
      <p className="fact">
        No ready tool makes images. Add a key in Tools, or import an image.
      </p>
    );
  }

  const make = () => {
    setState({ kind: "making" });
    makeStill({ ...props, choice, prompt: prompt.trim() })
      .then((made) => {
        if (!made.ok) {
          setState({ kind: "failed", failure: made.failure });
          return;
        }
        setState({ kind: "idle" });
        setPrompt("");
        props.onMade(made.assetId);
      })
      .catch((error: unknown) => {
        setState({
          kind: "failed",
          failure: { kind: "defect", message: String(error) },
        });
      });
  };

  return (
    <div className="make-still">
      <div className="field">
        <label htmlFor="still-prompt">What the still shows</label>
        <textarea
          id="still-prompt"
          rows={2}
          value={prompt}
          placeholder="The first picture of the clip"
          onChange={(event) => {
            setPrompt(event.target.value);
          }}
        />
      </div>
      {choices.length > 1 ? (
        <div className="switch" role="group" aria-label="Image model">
          {choices.map((candidate) => (
            <button
              key={candidate.key}
              type="button"
              aria-pressed={candidate.key === choice.key}
              onClick={() => {
                setChosenKey(candidate.key);
              }}
            >
              {candidate.model.label}
            </button>
          ))}
        </div>
      ) : undefined}
      <button
        type="button"
        disabled={prompt.trim() === "" || state.kind === "making"}
        onClick={make}
      >
        {state.kind === "making" ? "Making the still" : "Make the still"}
      </button>
      {state.kind === "failed" ? (
        <p className="failure" role="alert">
          {state.failure.message}{" "}
          {state.failure.hint === undefined ? undefined : (
            <strong>{state.failure.hint}</strong>
          )}
        </p>
      ) : undefined}
    </div>
  );
}
