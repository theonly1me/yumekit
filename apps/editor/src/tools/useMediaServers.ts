import { useCallback, useEffect, useMemo, useState } from "react";
import type { EngineClient, Reply } from "../engine/engineClient.js";
import { useEngineEvents } from "../engine/useEngineEvents.js";
import { mediaServerRequests, type MediaServers } from "./mediaServers.js";
import { failureTextOf } from "./requestText.js";

export type MediaServersState =
  | { kind: "loading" }
  | { kind: "ready"; servers: MediaServers }
  | { kind: "failed"; message: string };

function stateOf(listed: Reply<MediaServers>): MediaServersState {
  return listed.ok
    ? { kind: "ready", servers: listed.value }
    : { kind: "failed", message: failureTextOf(listed.failure) };
}

export function useMediaServers(client: EngineClient) {
  const requests = useMemo(() => mediaServerRequests(client), [client]);
  const [state, setState] = useState<MediaServersState>({ kind: "loading" });

  const reload = useCallback(async () => {
    setState(stateOf(await requests.list()));
  }, [requests]);

  const reloadInBackground = useCallback(() => {
    reload().catch((error: unknown) => {
      setState({ kind: "failed", message: String(error) });
    });
  }, [reload]);

  useEffect(() => {
    requests.list().then(
      (listed) => {
        setState(stateOf(listed));
      },
      (error: unknown) => {
        setState({ kind: "failed", message: String(error) });
      },
    );
  }, [requests]);

  useEngineEvents({
    client,
    onEvent: (event) => {
      if (
        event.type === "media-servers-changed" ||
        event.type === "connection-opened"
      ) {
        reloadInBackground();
      }
    },
  });

  return { state, requests, reload };
}
