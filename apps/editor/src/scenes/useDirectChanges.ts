import { useCallback, useMemo, useState } from "react";
import type { EngineClient } from "../engine/engineClient.js";
import { changeProject, type ChangeOutcome } from "./directChange.js";

export type ChangeArea = "scenes" | "sound" | "platforms";

export interface DirectChanges {
  run: (change: {
    area: ChangeArea;
    name: string;
    input: object;
  }) => Promise<ChangeOutcome>;
  failureOf: (area: ChangeArea) => string | undefined;
  voiceMayNotMatch: boolean;
}

export function useDirectChanges(client: EngineClient): DirectChanges {
  const [failure, setFailure] = useState<{
    area: ChangeArea;
    message: string;
  }>();
  const [voiceMayNotMatch, setVoiceMayNotMatch] = useState(false);

  const run = useCallback<DirectChanges["run"]>(
    async (change) => {
      setFailure(undefined);
      const outcome = await changeProject({
        client,
        name: change.name,
        input: change.input,
      }).catch((error: unknown) => ({
        kind: "failed" as const,
        message: `The change did not apply. ${String(error)}`,
      }));
      if (outcome.kind === "failed") {
        setFailure({ area: change.area, message: outcome.message });
        return outcome;
      }
      if (typeof outcome.data["voice_may_not_match"] === "boolean") {
        setVoiceMayNotMatch(outcome.voiceMayNotMatch);
      }
      return outcome;
    },
    [client],
  );

  const failureOf = useCallback(
    (area: ChangeArea) =>
      failure?.area === area ? failure.message : undefined,
    [failure],
  );

  return useMemo(
    () => ({ run, failureOf, voiceMayNotMatch }),
    [run, failureOf, voiceMayNotMatch],
  );
}
