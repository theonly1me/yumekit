import type { EngineClient } from "../engine/engineClient.js";
import { useMediaServers } from "../tools/useMediaServers.js";
import { VideoLimitRow } from "./VideoLimitRow.js";

export function LimitsGroup(props: { client: EngineClient }) {
  const { state } = useMediaServers(props.client);
  return (
    <section className="setting-group" aria-labelledby="limits-title">
      <h3 id="limits-title">Limits</h3>
      {state.kind === "ready" ? (
        <VideoLimitRow
          client={props.client}
          limitSeconds={state.servers.generated_video.limit_seconds}
          usedSeconds={state.servers.generated_video.used_seconds}
        />
      ) : (
        <div className="setting-row">
          <span>Real video in each project</span>
          <span className="limit-value">
            {state.kind === "failed" ? state.message : "Reading the limit"}
          </span>
        </div>
      )}
    </section>
  );
}
