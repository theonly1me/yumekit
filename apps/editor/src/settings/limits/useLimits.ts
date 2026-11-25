import { useCallback, useEffect, useState } from "react";
import type { EngineClient, Reply } from "../../engine/engineClient.js";
import { useEngineEvents } from "../../engine/useEngineEvents.js";
import { failureTextOf } from "../../tools/requestText.js";
import {
  readLimits,
  removeOwnLimits,
  saveLimit,
  type LimitName,
  type Limits,
  type LimitScope,
} from "./limitRequests.js";

export type LimitsState =
  | { kind: "loading" }
  | { kind: "ready"; limits: Limits }
  | { kind: "failed"; message: string };

export interface LimitChange {
  appliesTo: LimitScope;
  name: LimitName;
  value: number;
}

export function useLimits(client: EngineClient) {
  const [state, setState] = useState<LimitsState>({ kind: "loading" });

  const take = useCallback((reply: Reply<Limits>): string | undefined => {
    if (!reply.ok) return failureTextOf(reply.failure);
    setState({ kind: "ready", limits: reply.value });
    return undefined;
  }, []);

  const reload = useCallback(() => {
    readLimits(client).then(
      (reply) => {
        if (!reply.ok) {
          setState({ kind: "failed", message: failureTextOf(reply.failure) });
          return;
        }
        take(reply);
      },
      (error: unknown) => {
        setState({ kind: "failed", message: String(error) });
      },
    );
  }, [client, take]);

  useEffect(reload, [reload]);

  useEngineEvents({
    client,
    onEvent: (event) => {
      if (event.type === "media-servers-changed") reload();
    },
  });

  return {
    state,
    save: async (change: LimitChange) =>
      take(await saveLimit({ client, ...change })),
    removeOwn: async () => take(await removeOwnLimits(client)),
  };
}
