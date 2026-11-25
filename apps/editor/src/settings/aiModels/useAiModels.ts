import { useCallback, useEffect, useMemo, useState } from "react";
import type { EngineClient } from "../../engine/engineClient.js";
import { failureTextOf } from "../../tools/requestText.js";
import {
  aiModelRequests,
  type AgentModels,
  type AiRole,
  type ModelChoice,
} from "./aiModelRequests.js";

export type AiModelsState =
  | { kind: "loading" }
  | { kind: "ready"; agents: AgentModels[] }
  | { kind: "failed"; message: string };

export type SaveChoice = (options: {
  agent: string;
  role: AiRole;
  choice: ModelChoice;
}) => Promise<string | undefined>;

export function useAiModels(client: EngineClient) {
  const requests = useMemo(() => aiModelRequests(client), [client]);
  const [state, setState] = useState<AiModelsState>({ kind: "loading" });
  useEffect(() => {
    requests.list().then(
      (listed) => {
        setState(
          listed.ok
            ? { kind: "ready", agents: listed.value.agents }
            : { kind: "failed", message: failureTextOf(listed.failure) },
        );
      },
      (error: unknown) => {
        setState({ kind: "failed", message: String(error) });
      },
    );
  }, [requests]);
  const save = useCallback<SaveChoice>(
    async (options) => {
      const saved = await requests.save(options).catch(() => undefined);
      if (saved === undefined) return "yumekit could not save the choice.";
      if (!saved.ok) return failureTextOf(saved.failure);
      const next = saved.value;
      setState((current) =>
        current.kind === "ready"
          ? {
              kind: "ready",
              agents: current.agents.map((agent) =>
                agent.id === next.id ? next : agent,
              ),
            }
          : current,
      );
      return undefined;
    },
    [requests],
  );
  return { state, save };
}
