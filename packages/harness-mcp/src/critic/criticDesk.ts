import { randomUUID } from "node:crypto";
import type { ClipJob } from "./clip/clipJob.js";
import type { PlanJob } from "./plan/planJob.js";
import type { SheetJob } from "./sheet/sheetJob.js";
import type { StartJob } from "./start/startJob.js";

export type CriticJob = ClipJob | SheetJob | PlanJob | StartJob;

export const criticTurnsAtOnce = 3;

export interface CriticDesk {
  jobOf: (jobId: string | undefined) => CriticJob | undefined;
  run: <Result>(options: {
    job: CriticJob;
    work: (jobId: string) => Promise<Result>;
  }) => Promise<Result>;
}

export function createCriticDesk(): CriticDesk {
  const open = new Map<string, CriticJob>();
  const waiting: (() => void)[] = [];
  let running = 0;
  const takeTurn = async () => {
    if (running < criticTurnsAtOnce) {
      running += 1;
      return;
    }
    const turn = Promise.withResolvers<undefined>();
    waiting.push(() => {
      turn.resolve(undefined);
    });
    await turn.promise;
  };
  const giveTurn = () => {
    const next = waiting.shift();
    if (next === undefined) running -= 1;
    else next();
  };
  return {
    jobOf: (jobId) => {
      if (jobId !== undefined) return open.get(jobId);
      const [only, ...others] = [...open.values()];
      return others.length === 0 ? only : undefined;
    },
    run: async ({ job, work }) => {
      await takeTurn();
      const jobId = randomUUID();
      open.set(jobId, job);
      try {
        return await work(jobId);
      } finally {
        open.delete(jobId);
        giveTurn();
      }
    },
  };
}
