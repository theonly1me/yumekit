import { useCallback, useEffect, useRef, useState } from "react";
import type { EngineClient } from "../../engine/engineClient.js";
import { callInOrder } from "../../scenePanel/sceneCalls.js";

export const saveDelayMilliseconds = 1_000;

export type ScriptStatus =
  | { kind: "same" }
  | { kind: "changed" }
  | { kind: "asked" }
  | { kind: "refused"; message: string }
  | { kind: "failed"; message: string };

function revisionOf(data: Record<string, unknown>): number | undefined {
  const revision = data["revision"];
  return typeof revision === "number" ? revision : undefined;
}

export function useScriptSaves(options: {
  client: EngineClient;
  storedScript: string;
  revision: number;
}) {
  const { client } = options;
  const [status, setStatus] = useState<ScriptStatus>({ kind: "same" });
  const pending = useRef<string | undefined>(undefined);
  const timer = useRef<number | undefined>(undefined);
  const savedCount = useRef(0);
  const scriptBeforeSaves = useRef(options.storedScript);
  const ownRevision = useRef(0);
  const savesInFlight = useRef(0);
  const latest = useRef(options);

  useEffect(() => {
    latest.current = options;
  });

  const flush = useCallback(() => {
    window.clearTimeout(timer.current);
    timer.current = undefined;
    const script = pending.current;
    pending.current = undefined;
    if (script === undefined || script === latest.current.storedScript) return;
    if (savedCount.current === 0) {
      scriptBeforeSaves.current = latest.current.storedScript;
    }
    savesInFlight.current += 1;
    callInOrder({ client, name: "set_script", input: { script } })
      .finally(() => {
        savesInFlight.current -= 1;
      })
      .then((outcome) => {
        if (outcome.kind !== "done") {
          setStatus({ kind: "failed", message: outcome.message });
          return;
        }
        savedCount.current += 1;
        ownRevision.current = Math.max(
          ownRevision.current,
          revisionOf(outcome.result.data) ?? 0,
        );
        setStatus({ kind: "changed" });
      })
      .catch((error: unknown) => {
        setStatus({ kind: "failed", message: String(error) });
      });
  }, [client]);

  const change = useCallback(
    (script: string) => {
      pending.current = script;
      window.clearTimeout(timer.current);
      timer.current = window.setTimeout(flush, saveDelayMilliseconds);
    },
    [flush],
  );

  useEffect(() => flush, [flush]);

  const undoMine = useCallback(async () => {
    window.clearTimeout(timer.current);
    timer.current = undefined;
    pending.current = undefined;
    const count = savedCount.current;
    savedCount.current = 0;
    const isLastChangeMine = latest.current.revision === ownRevision.current;
    const calls = isLastChangeMine
      ? Array.from({ length: count }, () =>
          callInOrder({ client, name: "undo", input: {} }),
        )
      : [
          callInOrder({
            client,
            name: "set_script",
            input: { script: scriptBeforeSaves.current },
          }),
        ];
    const outcomes = await Promise.all(calls);
    const failed = outcomes.find((outcome) => outcome.kind === "rejected");
    setStatus(
      failed?.kind === "rejected"
        ? { kind: "failed", message: failed.message }
        : { kind: "same" },
    );
  }, [client]);

  return {
    status,
    change,
    flush,
    undoMine,
    isWaiting: () => pending.current !== undefined || savesInFlight.current > 0,
    isOwnRevision: (revision: number) => revision <= ownRevision.current,
    markAsked: () => {
      savedCount.current = 0;
      setStatus({ kind: "asked" });
    },
    markRefused: (message: string) => {
      setStatus({ kind: "refused", message });
    },
  };
}
