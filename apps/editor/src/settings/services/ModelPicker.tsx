import { useMemo, useState, type ReactNode } from "react";
import type { EngineClient } from "../../engine/engineClient.js";
import { KeyGuide } from "../../tools/KeyGuide.js";
import { mediaServerRequests } from "../../tools/mediaServers.js";
import {
  kindNames,
  type ChoiceModel,
  type ChoiceService,
  type MediaChoice,
  type ModelTarget,
} from "./mediaChoices.js";
import { ModelOption } from "./ModelOption.js";
import { ServiceLine } from "./ServiceLine.js";
import "./services.css";

type PickState =
  | { kind: "idle" }
  | { kind: "needs-key"; target: ModelTarget }
  | { kind: "saving"; target: ModelTarget }
  | { kind: "failed"; message: string };

const serviceStateNames: Record<ChoiceService["state"], string> = {
  ready: "Ready",
  "needs-key": "Needs a key",
  "key-not-working": "The key does not work",
  "not-ready": "Not ready",
};

function targetsOf(
  service: ChoiceService,
): { target: ModelTarget; model: ChoiceModel | undefined }[] {
  const base = { server: service.server, serverLabel: service.label };
  if (service.models.length === 0) {
    return [
      {
        target: { ...base, model: undefined, modelLabel: undefined },
        model: undefined,
      },
    ];
  }
  return service.models.map((model) => ({
    target: { ...base, model: model.id, modelLabel: model.label },
    model,
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
    if (
      options.service.state === "needs-key" ||
      options.service.state === "key-not-working"
    ) {
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
        const keyToAdd =
          service.state === "key-not-working"
            ? service.keys[0]
            : service.keys.find((key) => key.source === "missing");
        const waiting =
          state.kind === "needs-key" && state.target.server === service.server
            ? state.target
            : undefined;
        return (
          <section key={service.server} className="model-service">
            <h4>
              {service.label}
              <span className="model-service-state" data-state={service.state}>
                {serviceStateNames[service.state]}
              </span>
            </h4>
            {service.key_problem === null ? undefined : (
              <p className="fact key-problem">
                {service.state === "not-ready"
                  ? service.key_problem
                  : `The key does not work. ${service.label} says: ${service.key_problem}`}
              </p>
            )}
            <ServiceLine client={props.client} service={service} />
            <ul className="model-options">
              {targetsOf(service).map(({ target, model }) => (
                <li key={target.model ?? target.server}>
                  <ModelOption
                    target={target}
                    model={model}
                    isPicked={isSame({ target, selected: props.selected })}
                    isSaving={state.kind === "saving"}
                    onChoose={() => {
                      choose({ service, target });
                    }}
                  />
                </li>
              ))}
            </ul>
            {waiting !== undefined && keyToAdd !== undefined ? (
              <div className="model-key">
                <p className="fact">
                  {service.label} needs{" "}
                  {service.state === "key-not-working" ? "a new key" : "a key"}{" "}
                  first. yumekit uses {waiting.modelLabel ?? service.label}{" "}
                  after the key saves.
                </p>
                <KeyGuide
                  serverId={service.server}
                  mediaKey={keyToAdd}
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
