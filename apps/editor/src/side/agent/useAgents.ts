import { useCallback, useEffect, useMemo, useState } from "react";
import type { EngineClient, Reply } from "../../engine/engineClient.js";
import { useEngineEvents } from "../../engine/useEngineEvents.js";
import { failureTextOf } from "../../tools/requestText.js";
import { agentRequests, type AgentId, type Agents } from "./agentRequests.js";

export type AgentsState =
  | { kind: "loading" }
  | { kind: "ready"; agents: Agents }
  | { kind: "failed"; message: string };

export type ConnectState =
  | { kind: "idle" }
  | { kind: "connecting" }
  | { kind: "failed"; message: string };

function stateOf(listed: Reply<Agents>): AgentsState {
  return listed.ok
    ? { kind: "ready", agents: listed.value }
    : { kind: "failed", message: failureTextOf(listed.failure) };
}

export function useAgents(client: EngineClient) {
  const requests = useMemo(() => agentRequests(client), [client]);
  const [state, setState] = useState<AgentsState>({ kind: "loading" });
  const [connects, setConnects] = useState<
    Partial<Record<AgentId, ConnectState>>
  >({});

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
      if (event.type === "connection-opened") reload();
      if (event.type === "agents-changed") {
        setState((current) =>
          current.kind === "ready"
            ? {
                kind: "ready",
                agents: { ...current.agents, connected: event.connected },
              }
            : current,
        );
      }
    },
  });

  const connect = useCallback(
    async (agentId: AgentId) => {
      setConnects((current) => ({
        ...current,
        [agentId]: { kind: "connecting" },
      }));
      const connected = await requests.connect(agentId);
      setConnects((current) => ({
        ...current,
        [agentId]: connected.ok
          ? { kind: "idle" }
          : { kind: "failed", message: failureTextOf(connected.failure) },
      }));
      if (!connected.ok) return;
      const record = connected.value;
      setState((current) =>
        current.kind === "ready"
          ? {
              kind: "ready",
              agents: {
                ...current.agents,
                agents: current.agents.agents.map((agent) =>
                  agent.id === record.id ? record : agent,
                ),
              },
            }
          : current,
      );
    },
    [requests],
  );

  return { state, connects, connect };
}
