import { useState } from "react";
import type { EngineClient } from "../../engine/engineClient.js";
import {
  choiceOf,
  serviceAndModelText,
  type MediaKind,
  type ModelTarget,
} from "./mediaChoices.js";
import { ModelPicker } from "./ModelPicker.js";
import { currentModelOf, useMediaChoices } from "./useMediaChoices.js";

export interface OneTimeChoice {
  chosen: ModelTarget | undefined;
  onChoose: (target: ModelTarget) => void;
}

export function MadeWith(props: {
  client: EngineClient;
  kind: MediaKind;
  once?: OneTimeChoice;
}) {
  const { state, pick } = useMediaChoices(props.client);
  const [isOpen, setOpen] = useState(false);
  if (state.kind !== "ready") return null;
  const choice = choiceOf({ choices: state.choices, kind: props.kind });
  if (choice === undefined) return null;
  const shown =
    props.once?.chosen ?? currentModelOf({ state, kind: props.kind });
  const { once } = props;
  const onPick = async (target: ModelTarget) => {
    if (once === undefined) {
      const failure = await pick({ kind: props.kind, target });
      if (failure === undefined) setOpen(false);
      return failure;
    }
    once.onChoose(target);
    setOpen(false);
    return undefined;
  };
  return (
    <div className="made-with">
      <p>
        {shown === undefined
          ? "No service makes this yet."
          : `Made with ${serviceAndModelText(shown)}.`}{" "}
        <button
          type="button"
          className="link"
          aria-expanded={isOpen}
          onClick={() => {
            setOpen(!isOpen);
          }}
        >
          {isOpen ? "Done" : "Change"}
        </button>
      </p>
      {isOpen ? (
        <ModelPicker
          client={props.client}
          choice={choice}
          selected={shown}
          onPick={onPick}
        />
      ) : undefined}
    </div>
  );
}
