import type { ShotState, StateEntry, Strike } from "@yumekit/project";

export function entryText(entry: StateEntry): string {
  const count = entry.count === undefined ? "" : ` x${String(entry.count)}`;
  const held =
    entry.heldBy === undefined
      ? ""
      : `, held in the ${entry.heldBy.hand} hand of ${entry.heldBy.castId}`;
  const enters =
    entry.entersFrom === undefined ? "" : `, enters from ${entry.entersFrom}`;
  return `${entry.castId}${count}: ${entry.where}; screen ${entry.screen}, faces ${entry.facing}${held}; ${entry.state}${enters}`;
}

export function stateText(state: ShotState): string {
  return typeof state === "string"
    ? state
    : state.map((entry) => entryText(entry)).join(" | ");
}

export function endEntryNamesOf(state: ShotState): string[] {
  return typeof state === "string"
    ? ["end state"]
    : state.map((entry) => entry.castId);
}

export function strikeText(strike: Strike): string {
  const effect =
    strike.effect === undefined
      ? ""
      : `; the ${strike.effect.kind} starts at ${strike.effect.source} and travels ${strike.effect.path}`;
  return `${strike.by} strikes ${strike.target} at ${strike.contact}; ${strike.target} ${strike.reaction}${effect}`;
}
