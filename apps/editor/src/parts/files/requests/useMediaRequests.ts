import { useCallback, useEffect, useState } from "react";
import type { EngineClient } from "../../../engine/engineClient.js";
import { useEngineEvents } from "../../../engine/useEngineEvents.js";
import { failureTextOf } from "../../../tools/requestText.js";
import { readMediaRequests, type MediaRequest } from "./requestSchema.js";

export type MediaRequestsState =
  | { kind: "loading" }
  | { kind: "ready"; requests: MediaRequest[] }
  | { kind: "failed"; message: string };

const reloadingEvents = new Set([
  "work-changed",
  "project-changed",
  "connection-opened",
]);

export function useMediaRequests(client: EngineClient): MediaRequestsState {
  const [state, setState] = useState<MediaRequestsState>({ kind: "loading" });

  const reload = useCallback(() => {
    readMediaRequests(client).then(
      (read) => {
        setState(
          read.ok
            ? { kind: "ready", requests: read.value.requests }
            : { kind: "failed", message: failureTextOf(read.failure) },
        );
      },
      (error: unknown) => {
        setState({ kind: "failed", message: String(error) });
      },
    );
  }, [client]);

  useEffect(reload, [reload]);

  useEngineEvents({
    client,
    onEvent: (event) => {
      if (reloadingEvents.has(event.type)) reload();
    },
  });

  return state;
}
