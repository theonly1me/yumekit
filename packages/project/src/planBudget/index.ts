export interface BudgetShot {
  seconds: number;
}

export interface PlanBudget {
  plannedSeconds: number;
  retrySeconds: number;
  neededSeconds: number;
  limitSeconds: number;
  estimateUsd: number | undefined;
  limitUsd: number;
  warnings: string[];
}

export const retriedShotCount = 2;

const onlyThePerson =
  "Only the person can raise a limit, in Settings. The AI cannot.";

function secondsText(seconds: number): string {
  return String(Math.round(seconds * 10) / 10);
}

function dollarsText(usd: number): string {
  return `$${usd.toFixed(2)}`;
}

export function retrySecondsOf(shots: BudgetShot[]): number {
  return shots
    .map((shot) => shot.seconds)
    .toSorted((...[first, second]) => second - first)
    .slice(0, retriedShotCount)
    .reduce((...[total, seconds]) => total + seconds, 0);
}

export function planBudgetOf(options: {
  shots: BudgetShot[];
  estimateUsd: number | undefined;
  limitSeconds: number;
  limitUsd: number;
}): PlanBudget {
  const { shots, estimateUsd, limitSeconds, limitUsd } = options;
  const plannedSeconds = shots.reduce(
    (...[total, shot]) => total + shot.seconds,
    0,
  );
  const retrySeconds = retrySecondsOf(shots);
  const neededSeconds = plannedSeconds + retrySeconds;
  const warnings = [
    ...(neededSeconds > limitSeconds
      ? [
          `The ${String(shots.length)} shots of the plan have ${secondsText(plannedSeconds)} seconds of video. With one retry of the two longest shots (${secondsText(retrySeconds)} seconds more), the film needs about ${secondsText(neededSeconds)} seconds, and the limit of the project is ${secondsText(limitSeconds)} seconds of generated video. ${onlyThePerson}`,
        ]
      : []),
    ...(estimateUsd !== undefined && estimateUsd > limitUsd
      ? [
          `The plan costs about ${dollarsText(estimateUsd)} with that retry, and the spending limit of the project is ${dollarsText(limitUsd)}. ${onlyThePerson}`,
        ]
      : []),
  ];
  return {
    plannedSeconds,
    retrySeconds,
    neededSeconds,
    limitSeconds,
    estimateUsd,
    limitUsd,
    warnings,
  };
}
