import { useState } from "react";
import type { EngineClient } from "../../engine/engineClient.js";
import type { MediaServers } from "../../tools/mediaServers.js";
import { useMediaServers } from "../../tools/useMediaServers.js";
import { dollarsText } from "../dollarsText.js";
import type { LimitScope, WireLimits } from "./limitRequests.js";
import { dollarsUnit, LimitStepper, secondsUnit } from "./LimitStepper.js";
import { useLimits, type LimitChange } from "./useLimits.js";
import "./limits.css";

type SaveLimit = (change: LimitChange) => Promise<string | undefined>;

const scopeWords: Record<LimitScope, string> = {
  "every-project": "for every project",
  "this-project": "for this project",
};

function LimitRows(props: {
  appliesTo: LimitScope;
  limits: WireLimits;
  onSave: SaveLimit;
}) {
  const { appliesTo, limits } = props;
  return (
    <>
      <div className="setting-row">
        <span>
          Money
          <em>The lead stops and asks you before a project passes it.</em>
        </span>
        <LimitStepper
          name={`Money ${scopeWords[appliesTo]}`}
          value={limits.spending_usd}
          unit={dollarsUnit}
          onSave={(value) =>
            props.onSave({ appliesTo, name: "spending_usd", value })
          }
        />
      </div>
      <div className="setting-row">
        <span>
          Seconds of real video
          <em>
            Clips from a video model count. Pictures and drawn scenes do not.
          </em>
        </span>
        <LimitStepper
          name={`Seconds of real video ${scopeWords[appliesTo]}`}
          value={limits.generated_video_seconds}
          unit={secondsUnit}
          onSave={(value) =>
            props.onSave({ appliesTo, name: "generated_video_seconds", value })
          }
        />
      </div>
    </>
  );
}

function usedText(servers: MediaServers): string {
  const { spending, generated_video: video } = servers;
  const seconds = `${String(Math.round(video.used_seconds * 10) / 10)} of ${String(video.limit_seconds)} seconds of real video used.`;
  if (spending === undefined) return seconds;
  if ("record_not_valid" in spending) {
    return `The record of money spent in this project is damaged, so paid services stop. ${spending.record_not_valid} ${seconds}`;
  }
  return `Spent ${dollarsText(spending.spent_usd)} of ${dollarsText(spending.limit_usd)} on this project. ${seconds}`;
}

export function LimitsGroup(props: { client: EngineClient }) {
  const limits = useLimits(props.client);
  const servers = useMediaServers(props.client).state;
  const [switchingTo, setSwitchingTo] = useState<boolean>();
  const [failure, setFailure] = useState<string>();
  const { state } = limits;
  const ownLimits = state.kind === "ready" ? state.limits.this_project : null;
  const switchOwn = (isOn: boolean) => {
    if (state.kind !== "ready") return;
    setSwitchingTo(isOn);
    const switched = isOn
      ? limits.save({
          appliesTo: "this-project",
          name: "spending_usd",
          value: state.limits.every_project.spending_usd,
        })
      : limits.removeOwn();
    switched
      .then(setFailure, () => {
        setFailure("yumekit could not change the limits. Try again.");
      })
      .finally(() => {
        setSwitchingTo(undefined);
      });
  };
  return (
    <section className="setting-group limits" aria-labelledby="limits-title">
      <h3 id="limits-title">Limits for every project</h3>
      <p className="fact">
        Set these once. Each new project uses them, so you do not raise a limit
        for each project.
      </p>
      {state.kind === "ready" ? (
        <>
          <LimitRows
            appliesTo="every-project"
            limits={state.limits.every_project}
            onSave={limits.save}
          />
          <label className="switch setting-check">
            <input
              type="checkbox"
              checked={switchingTo ?? ownLimits !== null}
              disabled={switchingTo !== undefined}
              onChange={(event) => {
                switchOwn(event.currentTarget.checked);
              }}
            />
            <span>
              Use other limits for this project
              {ownLimits === null ? undefined : (
                <em>
                  This project keeps its own limits. A change of the limits for
                  every project does not change them.
                </em>
              )}
            </span>
          </label>
          {ownLimits === null ? undefined : (
            <div className="own-limits">
              <LimitRows
                appliesTo="this-project"
                limits={ownLimits}
                onSave={limits.save}
              />
            </div>
          )}
        </>
      ) : (
        <p className="fact">
          {state.kind === "failed" ? state.message : "Reading the limits."}
        </p>
      )}
      {failure === undefined ? undefined : (
        <p className="change-failure" role="alert">
          {failure}
        </p>
      )}
      {servers.kind === "ready" ? (
        <p className="spend-line">{usedText(servers.servers)}</p>
      ) : undefined}
    </section>
  );
}
