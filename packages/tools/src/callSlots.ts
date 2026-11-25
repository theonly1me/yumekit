export const defaultCallsAtOnce = 3;

export interface CallSlots {
  run: <Value>(options: {
    server: string;
    callsAtOnce: number;
    onWait: () => void;
    work: () => Promise<Value>;
  }) => Promise<Value>;
}

interface ServerLine {
  running: number;
  waiting: (() => void)[];
}

export function createCallSlots(): CallSlots {
  const lines = new Map<string, ServerLine>();
  const lineOf = (server: string): ServerLine => {
    const existing = lines.get(server);
    if (existing !== undefined) return existing;
    const created: ServerLine = { running: 0, waiting: [] };
    lines.set(server, created);
    return created;
  };
  return {
    run: async ({ server, callsAtOnce, onWait, work }) => {
      const line = lineOf(server);
      if (line.running >= callsAtOnce) {
        onWait();
        const turn = Promise.withResolvers<undefined>();
        line.waiting.push(() => {
          turn.resolve(undefined);
        });
        await turn.promise;
      } else {
        line.running += 1;
      }
      try {
        return await work();
      } finally {
        const next = line.waiting.shift();
        if (next === undefined) line.running -= 1;
        else next();
      }
    },
  };
}
