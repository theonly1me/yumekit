import type { Turn, TurnEnd } from "../brainTypes.js";
import { runTurn, type ProgramRun } from "./runTurn.js";

export interface PreparedRun {
  run: ProgramRun;
  cleanUp: () => Promise<void>;
}

export function startPreparedTurn(options: {
  prepare: () => Promise<PreparedRun>;
  preparationFailure: string;
}): Turn {
  let isStopRequested = false;
  let running: Turn | undefined;
  const run = async (): Promise<TurnEnd> => {
    const prepared = await options.prepare();
    try {
      if (isStopRequested) return { kind: "stopped" };
      running = runTurn(prepared.run);
      return await running.ended;
    } finally {
      await prepared.cleanUp();
    }
  };
  return {
    ended: run().catch((): TurnEnd => ({
      kind: "failed",
      reason: "program",
      message: options.preparationFailure,
    })),
    stop: () => {
      isStopRequested = true;
      running?.stop();
    },
  };
}
