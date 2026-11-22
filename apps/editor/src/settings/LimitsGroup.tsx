import type { EngineClient } from "../engine/engineClient.js";
import { useMediaServers } from "../tools/useMediaServers.js";

function limitText(options: { used: number; limit: number }): string {
  const used = Math.round(options.used * 10) / 10;
  return options.limit === 0
    ? `${String(used)} seconds used. Real video is turned off.`
    : `${String(used)} of ${String(options.limit)} seconds used`;
}

export function LimitsGroup(props: { client: EngineClient }) {
  const { state } = useMediaServers(props.client);
  return (
    <section className="setting-group" aria-labelledby="limits-title">
      <h3 id="limits-title">Limits</h3>
      <div className="setting-row">
        <span>
          Real video in each project
          <em>
            A video model stops when the project reaches this limit. To change
            it, set limits.generatedVideoSeconds in media-tools.json.
          </em>
        </span>
        <span className="limit-value">
          {state.kind === "ready"
            ? limitText({
                used: state.servers.generated_video.used_seconds,
                limit: state.servers.generated_video.limit_seconds,
              })
            : state.kind === "failed"
              ? state.message
              : "Reading the limit"}
        </span>
      </div>
    </section>
  );
}
