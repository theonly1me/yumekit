import { useEffect, useRef, useState } from "react";
import type { EngineClient } from "../engine/engineClient.js";
import type { Snapshot } from "../engine/snapshot.js";
import type { ExactRequest } from "./exactRequests.js";
import {
  answerLineOf,
  useLeadRequest,
  type LeadProgress,
} from "./useLeadRequest.js";

export interface LeadFailure {
  kind: string;
  message: string;
  hint?: string | undefined;
  used_seconds?: number | undefined;
  limit_seconds?: number | undefined;
}

export type LeadPhase<Made> =
  | { kind: "editing" }
  | { kind: "making"; progress: LeadProgress | undefined }
  | { kind: "failed"; failure: LeadFailure }
  | { kind: "made"; made: Made };

type Finished<Made> =
  { kind: "made"; made: Made } | { kind: "failed"; failure: LeadFailure };

export function useLeadMaking<Made>(options: {
  client: EngineClient;
  onFinished?: () => Promise<void>;
  onMade?: (made: Made) => void;
}) {
  const { client } = options;
  const lead = useLeadRequest(client);
  const finder = useRef<(snapshot: Snapshot) => Made | undefined>(
    () => undefined,
  );
  const [finished, setFinished] = useState<Finished<Made>>();
  const [early, setEarly] = useState<LeadFailure>();
  const [isPreparing, setPreparing] = useState(false);
  const { state } = lead;
  const onFinished = useRef(options.onFinished);
  const onMade = useRef(options.onMade);
  useEffect(() => {
    onFinished.current = options.onFinished;
    onMade.current = options.onMade;
  });

  useEffect(() => {
    if (state.kind !== "ended") return;
    const { answer } = state;
    let isCurrent = true;
    client
      .project()
      .then(async (project) => {
        const made = project.ok ? finder.current(project.value) : undefined;
        if (!isCurrent) return;
        setFinished(
          made === undefined
            ? {
                kind: "failed",
                failure: {
                  kind: "lead-did-not-make",
                  message: answerLineOf(answer),
                },
              }
            : { kind: "made", made },
        );
        if (made !== undefined) onMade.current?.(made);
        await onFinished.current?.();
      })
      .catch(() => undefined);
    return () => {
      isCurrent = false;
    };
  }, [state, client]);

  const phase: LeadPhase<Made> =
    early !== undefined
      ? { kind: "failed", failure: early }
      : isPreparing || state.kind === "sending" || state.kind === "running"
        ? {
            kind: "making",
            progress: state.kind === "running" ? state.progress : undefined,
          }
        : state.kind === "not-sent"
          ? {
              kind: "failed",
              failure: { kind: "not-sent", message: state.message },
            }
          : state.kind === "ended"
            ? (finished ?? { kind: "making", progress: undefined })
            : { kind: "editing" };

  return {
    phase,
    readiness: lead.readiness,
    begin: () => {
      setFinished(undefined);
      setEarly(undefined);
      setPreparing(true);
    },
    make: (request: {
      exact: ExactRequest;
      find: (snapshot: Snapshot) => Made | undefined;
    }) => {
      finder.current = request.find;
      setFinished(undefined);
      setEarly(undefined);
      setPreparing(false);
      lead.send(request.exact);
    },
    fail: (failure: LeadFailure) => {
      setPreparing(false);
      setEarly(failure);
    },
    reset: () => {
      setFinished(undefined);
      setEarly(undefined);
      setPreparing(false);
      lead.reset();
    },
  };
}
