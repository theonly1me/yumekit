import { newestLaterTakeOf, replacingTakeOf } from "@yumekit/project/takes";
import type { Take } from "./takeTypes.js";

export interface NewerTake {
  newest: Take;
  replacedBy: Take;
}

export function newerTakeOf(options: {
  takes: readonly Take[];
  take: Take;
}): NewerTake | undefined {
  const newest = newestLaterTakeOf(options);
  const replacedBy = replacingTakeOf(options);
  return newest === undefined || replacedBy === undefined
    ? undefined
    : { newest, replacedBy };
}

export function isReadOnlyTake(options: {
  take: Take;
  newer: NewerTake | undefined;
}): boolean {
  return options.take.state === "sent" || options.newer !== undefined;
}
