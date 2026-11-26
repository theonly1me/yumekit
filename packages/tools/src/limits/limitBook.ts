import type { UserFileFailure } from "../choiceTypes.js";
import { readMediaToolsConfiguration } from "../configuration.js";
import type { ConnectFailure, MediaLimits, Outcome } from "../types.js";
import {
  hasOwnLimits,
  limitsInUseOf,
  type LimitScope,
  type LimitSources,
} from "./limitSources.js";
import { removeOwnLimits, saveLimits } from "./saveLimits.js";

export interface LimitChange {
  appliesTo: LimitScope;
  limits: Partial<MediaLimits>;
}

export interface LimitBook {
  inUse: () => Promise<MediaLimits>;
  sources: () => Promise<Outcome<LimitSources, ConnectFailure>>;
  set: (change: LimitChange) => Promise<Outcome<LimitSources, UserFileFailure>>;
  removeOwn: () => Promise<Outcome<LimitSources, UserFileFailure>>;
}

export function createLimitBook(options: {
  projectFolder: string;
  sources: LimitSources;
}): LimitBook {
  const { projectFolder } = options;
  let lastRead = options.sources;
  let reading: Promise<Outcome<LimitSources, ConnectFailure>> | undefined;
  const readFresh = async (): Promise<
    Outcome<LimitSources, ConnectFailure>
  > => {
    const read = await readMediaToolsConfiguration({
      projectFolder,
      bundledServers: {},
    });
    if (!read.ok) return read;
    lastRead = read.value.limitSources;
    return { ok: true, value: lastRead };
  };
  const sources = () => {
    reading ??= readFresh().finally(() => {
      reading = undefined;
    });
    return reading;
  };
  return {
    inUse: async () => {
      await sources();
      return limitsInUseOf(lastRead);
    },
    sources,
    set: async (change) => {
      const current = await readFresh();
      if (!current.ok) return current;
      const limits =
        change.appliesTo === "this-project"
          ? { ...limitsInUseOf(current.value), ...change.limits }
          : change.limits;
      const saved = await saveLimits({
        projectFolder,
        appliesTo: change.appliesTo,
        limits,
      });
      return saved.ok ? readFresh() : saved;
    },
    removeOwn: async () => {
      const current = await readFresh();
      if (!current.ok || !hasOwnLimits(current.value)) return current;
      const removed = await removeOwnLimits(projectFolder);
      return removed.ok ? readFresh() : removed;
    },
  };
}
