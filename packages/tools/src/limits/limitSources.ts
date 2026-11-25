import type { MediaLimits } from "../types.js";

export const defaultGeneratedVideoSeconds = 60;
export const defaultSpendingUsd = 5;

export type LimitScope = "every-project" | "this-project";

export interface LimitSources {
  everyProject: MediaLimits;
  thisProject: Partial<MediaLimits>;
}

interface FileLimits {
  generatedVideoSeconds?: number | undefined;
  spendingUsd?: number | undefined;
}

export function limitSourcesOf(options: {
  userLimits: FileLimits | undefined;
  projectLimits: FileLimits | undefined;
}): LimitSources {
  const { userLimits, projectLimits } = options;
  const projectSeconds = projectLimits?.generatedVideoSeconds;
  const projectUsd = projectLimits?.spendingUsd;
  return {
    everyProject: {
      generatedVideoSeconds:
        userLimits?.generatedVideoSeconds ?? defaultGeneratedVideoSeconds,
      spendingUsd: userLimits?.spendingUsd ?? defaultSpendingUsd,
    },
    thisProject: {
      ...(projectSeconds === undefined
        ? {}
        : { generatedVideoSeconds: projectSeconds }),
      ...(projectUsd === undefined ? {} : { spendingUsd: projectUsd }),
    },
  };
}

export function limitsInUseOf(sources: LimitSources): MediaLimits {
  return { ...sources.everyProject, ...sources.thisProject };
}

export function hasOwnLimits(sources: LimitSources): boolean {
  return Object.keys(sources.thisProject).length > 0;
}
