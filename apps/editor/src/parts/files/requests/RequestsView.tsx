import { useState } from "react";
import type { EngineClient } from "../../../engine/engineClient.js";
import type { Asset } from "../../../engine/snapshot.js";
import type { MediaServers } from "../../../tools/mediaServers.js";
import { RequestRow } from "./RequestRow.js";
import { useMediaRequests } from "./useMediaRequests.js";
import "./requests.css";

export const noRequestsText =
  "No requests yet. When the AI or you make a picture, a voice, music, or a video clip, each request to a service shows here, also one that fails.";

function serviceLabels(servers: MediaServers | undefined) {
  return (server: string) =>
    servers?.servers.find((entry) => entry.server === server)?.label ?? server;
}

export function RequestsView(props: {
  client: EngineClient;
  assets: Asset[];
  servers: MediaServers | undefined;
}) {
  const state = useMediaRequests(props.client);
  const [onlyFailed, setOnlyFailed] = useState(false);
  if (state.kind === "loading") {
    return (
      <p className="fact lead" role="status">
        Loading the requests.
      </p>
    );
  }
  if (state.kind === "failed") {
    return (
      <p className="fact lead" role="alert">
        The requests did not load: {state.message}
      </p>
    );
  }
  const { requests } = state;
  if (requests.length === 0)
    return <p className="fact lead">{noRequestsText}</p>;
  const failedCount = requests.filter(
    (request) => request.failure !== undefined,
  ).length;
  const shown = onlyFailed
    ? requests.filter((request) => request.failure !== undefined)
    : requests;
  return (
    <div className="requests-part">
      <div className="requests-intro">
        <p className="fact">
          Each request to a service, the newest first: {requests.length} in all,{" "}
          {failedCount} failed. Each prompt is exactly what yumekit sent, with
          nothing added.
        </p>
        {failedCount === 0 ? undefined : (
          <label className="requests-filter">
            <input
              type="checkbox"
              checked={onlyFailed}
              onChange={(event) => {
                setOnlyFailed(event.target.checked);
              }}
            />
            Only the failed ones
          </label>
        )}
      </div>
      <ul className="request-rows" aria-label="Requests">
        {shown.map((request) => (
          <RequestRow
            key={`${request.at}-${request.asset_id}`}
            client={props.client}
            request={request}
            assets={props.assets}
            serviceLabelOf={serviceLabels(props.servers)}
          />
        ))}
      </ul>
    </div>
  );
}
