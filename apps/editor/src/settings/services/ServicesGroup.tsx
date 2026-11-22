import { useState } from "react";
import type { EngineClient } from "../../engine/engineClient.js";
import { currentNoteOf } from "./currentNote.js";
import {
  kindNames,
  serviceAndModelText,
  targetOfCurrent,
  type MediaChoice,
} from "./mediaChoices.js";
import { ModelPicker } from "./ModelPicker.js";
import { useMediaChoices } from "./useMediaChoices.js";

function ServiceRow(props: {
  client: EngineClient;
  choice: MediaChoice;
  pick: ReturnType<typeof useMediaChoices>["pick"];
}) {
  const { choice } = props;
  const [isOpen, setOpen] = useState(false);
  const kindName = kindNames[choice.capability];
  const current = choice.current ?? undefined;
  const target = current === undefined ? undefined : targetOfCurrent(current);
  const note =
    current === undefined
      ? undefined
      : currentNoteOf({ current, kind: choice.capability });
  return (
    <li className="service-row">
      <div className="setting-row">
        <span>
          {kindName}
          <em>
            {target === undefined
              ? "No service makes this yet."
              : serviceAndModelText(target)}
            {note === undefined ? undefined : (
              <span className="service-note"> {note}</span>
            )}
          </em>
        </span>
        <button
          type="button"
          aria-expanded={isOpen}
          aria-label={`Change ${kindName}`}
          onClick={() => {
            setOpen(!isOpen);
          }}
        >
          {isOpen ? "Done" : "Change"}
        </button>
      </div>
      {isOpen ? (
        <ModelPicker
          client={props.client}
          choice={choice}
          selected={target}
          onPick={(picked) =>
            props.pick({ kind: choice.capability, target: picked })
          }
          extra={
            current?.source === "picked" ? (
              <button
                type="button"
                className="link service-reset"
                onClick={() => {
                  props
                    .pick({ kind: choice.capability, target: undefined })
                    .catch(() => undefined);
                }}
              >
                Let yumekit pick the first service that is ready
              </button>
            ) : undefined
          }
        />
      ) : undefined}
    </li>
  );
}

export function ServicesGroup(props: { client: EngineClient }) {
  const { state, pick } = useMediaChoices(props.client);
  return (
    <section className="setting-group" aria-labelledby="services-title">
      <h3 id="services-title">Services</h3>
      <p className="fact">
        Pick the service and the model that make each part of the video.
      </p>
      {state.kind === "ready" ? (
        <ul className="setting-rows" aria-label="Services">
          {state.choices.choices.map((choice) => (
            <ServiceRow
              key={choice.capability}
              client={props.client}
              choice={choice}
              pick={pick}
            />
          ))}
        </ul>
      ) : (
        <p
          className="fact"
          role={state.kind === "failed" ? "alert" : undefined}
        >
          {state.kind === "failed" ? state.message : "Reading the services."}
        </p>
      )}
    </section>
  );
}
