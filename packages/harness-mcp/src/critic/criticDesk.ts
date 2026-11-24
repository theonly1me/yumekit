import type { ClipJob } from "./clip/clipJob.js";
import type { SheetJob } from "./sheet/sheetJob.js";

export type CriticJob = ClipJob | SheetJob;

export interface CriticDesk {
  current: () => CriticJob | undefined;
  run: <Result>(options: {
    job: CriticJob;
    work: () => Promise<Result>;
  }) => Promise<Result>;
}

export function createCriticDesk(): CriticDesk {
  let open: CriticJob | undefined;
  let queue: Promise<void> = Promise.resolve();
  return {
    current: () => open,
    run: async ({ job, work }) => {
      const previous = queue;
      const finished = Promise.withResolvers<undefined>();
      queue = finished.promise;
      await previous;
      open = job;
      try {
        return await work();
      } finally {
        open = undefined;
        finished.resolve(undefined);
      }
    },
  };
}
