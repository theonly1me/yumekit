import { describe, expect, it } from "vitest";
import type { Take, TakeState, TakeStep } from "../format/takes.js";
import {
  currentTakesOf,
  isTakeReplaced,
  isTakeWaiting,
  newestTakeOf,
  replacingTakeOf,
  waitingTakesOf,
} from "./newestTakes.js";

function takeOf(options: {
  number: number;
  step: TakeStep;
  state: TakeState;
  chapterId?: string;
  id?: string;
}): Take {
  return {
    id: options.id ?? `take-${String(options.number)}`,
    ...(options.step === "story"
      ? {}
      : { chapterId: options.chapterId ?? "film" }),
    step: options.step,
    number: options.number,
    state: options.state,
    openedAt: `2026-11-26T12:0${String(options.number)}:00.000Z`,
    items: [],
    notes: [],
  };
}

const ownersTakes: Take[] = [
  takeOf({ number: 1, step: "pictures", state: "sent" }),
  takeOf({ number: 2, step: "clips", state: "ready" }),
  takeOf({ number: 3, step: "cut", state: "ready" }),
  takeOf({ number: 4, step: "pictures", state: "sent" }),
  takeOf({ number: 5, step: "clips", state: "sent" }),
  takeOf({ number: 6, step: "clips", state: "open" }),
];

function numbersOf(takes: readonly Take[]): number[] {
  return takes.map((take) => take.number);
}

function ownersTake(number: number): Take {
  const take = ownersTakes.find((candidate) => candidate.number === number);
  if (take === undefined) throw new Error(`No take ${String(number)}`);
  return take;
}

describe("the newest take of a chapter", () => {
  it("lets no older ready take wait once the lead moved on, as in the owner's project", () => {
    expect(numbersOf(waitingTakesOf(ownersTakes))).toEqual([]);
    expect(numbersOf(currentTakesOf(ownersTakes))).toEqual([6]);
    expect(
      newestTakeOf({ takes: ownersTakes, chapterId: "film" })?.number,
    ).toBe(6);
  });

  it("names the next take of the same step as the one that replaced a take, else the newest take", () => {
    expect(
      replacingTakeOf({ takes: ownersTakes, take: ownersTake(2) })?.number,
    ).toBe(5);
    expect(
      replacingTakeOf({ takes: ownersTakes, take: ownersTake(3) })?.number,
    ).toBe(6);
    expect(
      replacingTakeOf({ takes: ownersTakes, take: ownersTake(6) }),
    ).toBeUndefined();
  });

  it("keeps a ready take waiting while it is the newest of its chapter", () => {
    const takes = [
      ...ownersTakes.slice(0, 5),
      takeOf({ number: 6, step: "clips", state: "ready" }),
    ];
    expect(numbersOf(waitingTakesOf(takes))).toEqual([6]);
  });

  it("keeps the ready cut of one chapter waiting while the lead works on the next chapter", () => {
    const takes = [
      takeOf({ number: 1, step: "cut", state: "ready", chapterId: "harbor" }),
      takeOf({
        number: 1,
        step: "pictures",
        state: "open",
        chapterId: "sea",
        id: "take-2",
      }),
    ];
    const [cut] = takes;
    if (cut === undefined) throw new Error("No cut");
    expect(isTakeWaiting({ takes, take: cut })).toBe(true);
    expect(numbersOf(currentTakesOf(takes))).toEqual([1, 1]);
  });

  it("counts a ready story as replaced when the lead opened a take of a chapter after it", () => {
    const takes = [
      takeOf({ number: 1, step: "story", state: "ready" }),
      takeOf({ number: 1, step: "pictures", state: "open", id: "take-2" }),
    ];
    const [story] = takes;
    if (story === undefined) throw new Error("No story");
    expect(isTakeReplaced({ takes, take: story })).toBe(true);
    expect(replacingTakeOf({ takes, take: story })?.step).toBe("pictures");
  });
});
