import type { NewerTake } from "../takes/newerTake.js";
import type { FootButton, NextAction } from "./nextAction.js";

export function goToNewest(newer: NewerTake): FootButton {
  return {
    id: "open-latest",
    label: `Go to take ${String(newer.newest.number)}`,
    isPrimary: true,
  };
}

export function replacedActionOf(newer: NewerTake): NextAction {
  return {
    line: `Take ${String(newer.replacedBy.number)} replaced this take, so it is only to look at.`,
    buttons: [goToNewest(newer)],
  };
}
