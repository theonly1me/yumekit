import type { EngineClient } from "../engine/engineClient.js";
import type { MediaServers } from "../tools/mediaServers.js";
import { useMediaServers } from "../tools/useMediaServers.js";
import { SpendingLimitRow } from "./SpendingLimitRow.js";
import { VideoLimitRow } from "./VideoLimitRow.js";

function SpendingRow(props: { client: EngineClient; servers: MediaServers }) {
  const { spending } = props.servers;
  if (spending === undefined) return undefined;
  if ("record_not_valid" in spending) {
    return (
      <div className="setting-row">
        <span>Money for paid services in each project</span>
        <p className="change-failure" role="alert">
          The spending record of this project is damaged, so paid services stop.{" "}
          {spending.record_not_valid}
        </p>
      </div>
    );
  }
  return (
    <SpendingLimitRow
      client={props.client}
      spending={{
        limitUsd: spending.limit_usd,
        spentUsd: spending.spent_usd,
        remainingUsd: spending.remaining_usd,
      }}
    />
  );
}

export function LimitsGroup(props: { client: EngineClient }) {
  const { state } = useMediaServers(props.client);
  return (
    <section className="setting-group" aria-labelledby="limits-title">
      <h3 id="limits-title">Limits</h3>
      {state.kind === "ready" ? (
        <>
          <SpendingRow client={props.client} servers={state.servers} />
          <VideoLimitRow
            client={props.client}
            limitSeconds={state.servers.generated_video.limit_seconds}
            usedSeconds={state.servers.generated_video.used_seconds}
          />
        </>
      ) : (
        <div className="setting-row">
          <span>Money and AI video in each project</span>
          <span className="limit-value">
            {state.kind === "failed" ? state.message : "Reading the limits"}
          </span>
        </div>
      )}
    </section>
  );
}
