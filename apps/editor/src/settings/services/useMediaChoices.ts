import { useCallback, useEffect, useMemo, useState } from "react";
import type { EngineClient, Reply } from "../../engine/engineClient.js";
import { useEngineEvents } from "../../engine/useEngineEvents.js";
import { failureTextOf } from "../../tools/requestText.js";
import {
  choiceOf,
  mediaChoiceRequests,
  targetOfCurrent,
  type MediaChoices,
  type MediaKind,
  type ModelTarget,
} from "./mediaChoices.js";

export type MediaChoicesState =
  | { kind: "loading" }
  | { kind: "ready"; choices: MediaChoices }
  | { kind: "failed"; message: string };

function stateOf(listed: Reply<MediaChoices>): MediaChoicesState {
  return listed.ok
    ? { kind: "ready", choices: listed.value }
    : { kind: "failed", message: failureTextOf(listed.failure) };
}

export function useMediaChoices(client: EngineClient) {
  const requests = useMemo(() => mediaChoiceRequests(client), [client]);
  const [state, setState] = useState<MediaChoicesState>({ kind: "loading" });

  const reload = useCallback(() => {
    requests.list().then(
      (listed) => {
        setState(stateOf(listed));
      },
      (error: unknown) => {
        setState({ kind: "failed", message: String(error) });
      },
    );
  }, [requests]);

  useEffect(reload, [reload]);

  useEngineEvents({
    client,
    onEvent: (event) => {
      if (
        event.type === "media-servers-changed" ||
        event.type === "connection-opened"
      ) {
        reload();
      }
    },
  });

  const pick = useCallback(
    async (options: {
      kind: MediaKind;
      target: ModelTarget | undefined;
    }): Promise<string | undefined> => {
      const picked = await requests.pick(options);
      if (!picked.ok) return failureTextOf(picked.failure);
      setState({ kind: "ready", choices: picked.value });
      return undefined;
    },
    [requests],
  );

  return { state, pick };
}

export function currentModelOf(options: {
  state: MediaChoicesState;
  kind: MediaKind;
}): ModelTarget | undefined {
  if (options.state.kind !== "ready") return undefined;
  const current = choiceOf({
    choices: options.state.choices,
    kind: options.kind,
  })?.current;
  return current === null || current === undefined
    ? undefined
    : targetOfCurrent(current);
}
