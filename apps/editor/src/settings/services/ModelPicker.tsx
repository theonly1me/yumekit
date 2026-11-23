import { useMemo, useState, type ReactNode } from "react";
import type { EngineClient } from "../../engine/engineClient.js";
import { KeyGuide } from "../../tools/KeyGuide.js";
import { mediaServerRequests } from "../../tools/mediaServers.js";
import {
  kindNames,
  type ChoiceService,
  type MediaChoice,
  type ModelTarget,
} from "./mediaChoices.js";
import "./services.css";

const serviceLines: Partial<Record<string, string>> = {
  "local-voice": "Free. It runs on your computer.",
};

type PickState =
  | { kind: "idle" }
  | { kind: "needs-key"; target: ModelTarget }
  | { kind: "saving"; target: ModelTarget }
  | { kind: "failed"; message: string };

function targetsOf(service: ChoiceService): ModelTarget[] {
  const base = { server: service.server, serverLabel: service.label };
  if (service.models.length === 0) {
    return [{ ...base, model: undefined, modelLabel: undefined }];
  }
  return service.models.map((model) => ({
    ...base,
    model: model.id,
    modelLabel: model.label,
  }));
}

function isSame(options: {
  target: ModelTarget;
  selected: ModelTarget | undefined;
}): boolean {
  const { target, selected } = options;
  if (selected?.server !== target.server) return false;
  return target.model === undefined || target.model === selected.model;
}

export function ModelPicker(props: {
  client: EngineClient;
  choice: MediaChoice;
  selected: ModelTarget | undefined;
  onPick: (target: ModelTarget) => Promise<string | undefined>;
  extra?: ReactNode;
}) {
  const keyRequests = useMemo(
    () => mediaServerRequests(props.client),
    [props.client],
  );
  const [state, setState] = useState<PickState>({ kind: "idle" });
  const kindName = kindNames[props.choice.capability];

  const apply = (target: ModelTarget) => {
    setState({ kind: "saving", target });
    props.onPick(target).then(
      (failure) => {
        setState(
          failure === undefined
            ? { kind: "idle" }
            : { kind: "failed", message: failure },
        );
      },
      (error: unknown) => {
        setState({ kind: "failed", message: String(error) });
      },
    );
  };

  const choose = (options: { service: ChoiceService; target: ModelTarget }) => {
    if (options.service.state === "needs-key") {
      setState({ kind: "needs-key", target: options.target });
    } else {
      apply(options.target);
    }
  };

  return (
    <div
      className="model-picker"
      role="group"
      aria-label={`Models for ${kindName}`}
    >
      {props.choice.services.length === 0 ? (
        <p className="fact">No service makes {kindName.toLowerCase()} yet.</p>
      ) : undefined}
      {props.choice.services.map((service) => {
        const missingKey = service.keys.find((key) => key.source === "missing");
        const waiting =
          state.kind === "needs-key" && state.target.server === service.server
            ? state.target
            : undefined;
        return (
          <section key={service.server} className="model-service">
            <h4>
              {service.label}
              <span className="model-service-state">
                {service.state === "ready" ? "Ready" : "Needs a key"}
              </span>
            </h4>
            {serviceLines[service.server] === undefined ? undefined : (
              <p className="fact">{serviceLines[service.server]}</p>
            )}
            <ul className="model-options">
              {targetsOf(service).map((target) => (
                <li key={target.model ?? target.server}>
                  <button
                    type="button"
                    className="model-option"
                    aria-pressed={isSame({ target, selected: props.selected })}
                    disabled={state.kind === "saving"}
                    onClick={() => {
                      choose({ service, target });
                    }}
                  >
                    {target.modelLabel ?? "The model of this service"}
                  </button>
                </li>
              ))}
            </ul>
            {waiting !== undefined && missingKey !== undefined ? (
              <div className="model-key">
                <p className="fact">
                  {service.label} needs a key first. yumekit uses{" "}
                  {waiting.modelLabel ?? service.label} after the key saves.
                </p>
                <KeyGuide
                  serverId={service.server}
                  mediaKey={missingKey}
                  requests={keyRequests}
                  onSaved={() => {
                    apply(waiting);
                  }}
                />
              </div>
            ) : undefined}
          </section>
        );
      })}
      {props.extra}
      {state.kind === "failed" ? (
        <p className="failure" role="alert">
          {state.message}
        </p>
      ) : undefined}
    </div>
  );
}
