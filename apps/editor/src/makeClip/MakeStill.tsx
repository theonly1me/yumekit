import { useState } from "react";
import type { EngineClient } from "../engine/engineClient.js";
import type { Asset, Output } from "../engine/snapshot.js";
import { useLeadMaking } from "../lead/useLeadMaking.js";
import { stillRequestOf } from "./makeClip.js";
import type { ModelChoice } from "./modelChoices.js";

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
  const making = useLeadMaking<string>({
    client: props.client,
    onMade: (assetId) => {
      setPrompt("");
      props.onMade(assetId);
    },
  });
  const state = making.phase;
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
    const { assetId, request } = stillRequestOf({
      ...props,
      choice,
      prompt: prompt.trim(),
      aboutClipId: undefined,
    });
    making.make({
      exact: request,
      find: (snapshot) =>
        snapshot.assets.some((asset) => asset.id === assetId)
          ? assetId
          : undefined,
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
        <div className="segments" role="group" aria-label="Image model">
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
        disabled={
          prompt.trim() === "" ||
          state.kind === "making" ||
          making.readiness.kind === "missing"
        }
        onClick={make}
      >
        {state.kind === "making"
          ? "The AI is making the still"
          : "Make the still"}
      </button>
      {making.readiness.kind === "missing" ? (
        <p className="fact">{making.readiness.message}</p>
      ) : undefined}
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
