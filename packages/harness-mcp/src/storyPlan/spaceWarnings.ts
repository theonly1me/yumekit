import type { Shot, ShotState, StateEntry } from "@yumekit/project";
import { stateText } from "./stateText.js";

export function stateWords(text: string): string {
  return text
    .toLowerCase()
    .replace(/[.,;:!?]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function isSameState(options: {
  first: ShotState;
  second: ShotState;
}): boolean {
  return (
    stateWords(stateText(options.first)) ===
    stateWords(stateText(options.second))
  );
}

function differencesOf(options: {
  before: StateEntry;
  after: StateEntry;
}): string[] {
  const { before, after } = options;
  const heldText = (entry: StateEntry) =>
    entry.heldBy === undefined
      ? "no hand"
      : `the ${entry.heldBy.hand} hand of ${entry.heldBy.castId}`;
  return [
    ...(stateWords(before.where) === stateWords(after.where)
      ? []
      : [`where (${before.where} / ${after.where})`]),
    ...(before.screen === after.screen
      ? []
      : [`screen side (${before.screen} / ${after.screen})`]),
    ...(before.facing === after.facing
      ? []
      : [`facing (${before.facing} / ${after.facing})`]),
    ...(heldText(before) === heldText(after)
      ? []
      : [`holder (${heldText(before)} / ${heldText(after)})`]),
    ...(stateWords(before.state) === stateWords(after.state)
      ? []
      : [`state (${before.state} / ${after.state})`]),
  ];
}

function cutWarnings(options: { before: Shot; shot: Shot }): string[] {
  const { before, shot } = options;
  if (
    typeof before.endState === "string" ||
    typeof shot.startState === "string"
  ) {
    return isSameState({ first: before.endState, second: shot.startState })
      ? []
      : [
          `Shot "${shot.id}" is in the same place as "${before.id}", but its start state differs from the end state before it. Start it where "${before.id}" ends: ${stateText(before.endState)}`,
        ];
  }
  const ended = before.endState;
  return shot.startState.flatMap((after) => {
    const previous = ended.find((entry) => entry.castId === after.castId);
    if (previous === undefined) return [];
    const differences = differencesOf({ before: previous, after });
    if (differences.length === 0) return [];
    return [
      `"${after.castId}" changes across the cut from "${before.id}" to "${shot.id}" with no move between them: ${differences.join(", ")}. Keep the place, the screen side, and the facing across a cut, or plan a shot that shows the move.`,
    ];
  });
}

function entranceWarnings(shots: Shot[]): string[] {
  const counts = new Map<string, number>();
  return shots.flatMap((...[shot, index]) => {
    const warnings =
      typeof shot.startState === "string"
        ? []
        : shot.startState.flatMap((entry) => {
            const known = counts.get(entry.castId);
            const count = entry.count ?? 1;
            const isNew = known === undefined && index > 0;
            const grows = known !== undefined && count > known;
            if ((!isNew && !grows) || entry.entersFrom !== undefined) return [];
            return [
              isNew
                ? `"${entry.castId}" first shows in shot "${shot.id}" with no place where it waited. Give enters_from, or show it enter on screen.`
                : `More "${entry.castId}" show in shot "${shot.id}" (${String(count)}, before ${String(known)}). Where did they come from? Give enters_from.`,
            ];
          });
    for (const state of [shot.startState, shot.endState]) {
      if (typeof state === "string") continue;
      for (const entry of state) counts.set(entry.castId, entry.count ?? 1);
    }
    return warnings;
  });
}

export function spaceWarningsOf(shots: Shot[]): string[] {
  const cuts = shots.flatMap((...[shot, index]) => {
    const before = shots[index - 1];
    return before?.placeId === shot.placeId
      ? cutWarnings({ before, shot })
      : [];
  });
  return [...cuts, ...entranceWarnings(shots)];
}
