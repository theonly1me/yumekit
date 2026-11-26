import type { Take } from "../format/takes.js";

function isInGroupOf(options: { take: Take; later: Take }): boolean {
  return (
    options.take.step === "story" ||
    options.later.chapterId === options.take.chapterId
  );
}

function laterTakesOf(options: { takes: readonly Take[]; take: Take }): Take[] {
  const { takes, take } = options;
  const index = takes.findIndex((candidate) => candidate.id === take.id);
  if (index === -1) return [];
  return takes.slice(index + 1).filter((later) => isInGroupOf({ take, later }));
}

export function replacingTakeOf(options: {
  takes: readonly Take[];
  take: Take;
}): Take | undefined {
  const later = laterTakesOf(options);
  return (
    later.find((candidate) => candidate.step === options.take.step) ??
    later.at(-1)
  );
}

export function newestLaterTakeOf(options: {
  takes: readonly Take[];
  take: Take;
}): Take | undefined {
  return laterTakesOf(options).at(-1);
}

export function isTakeReplaced(options: {
  takes: readonly Take[];
  take: Take;
}): boolean {
  return laterTakesOf(options).length > 0;
}

export function isTakeWaiting(options: {
  takes: readonly Take[];
  take: Take;
}): boolean {
  return options.take.state === "ready" && !isTakeReplaced(options);
}

export function waitingTakesOf(takes: readonly Take[]): Take[] {
  return takes.filter((take) => isTakeWaiting({ takes, take }));
}

export function newestTakeOf(options: {
  takes: readonly Take[];
  chapterId: string | undefined;
}): Take | undefined {
  return options.takes.findLast((take) => take.chapterId === options.chapterId);
}

export function currentTakesOf(takes: readonly Take[]): Take[] {
  return takes.filter(
    (take) => take.state === "open" || isTakeWaiting({ takes, take }),
  );
}
