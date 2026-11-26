import { nextWorkOf } from "@yumekit/project/takes";
import { moneyLineOf, raisedLimitOf } from "../../chat/money/MoneyButtons.js";
import type { Take } from "../takes/takeSchema.js";
import type { WorkState } from "../work/workState.js";
import type { NextAction } from "./nextAction.js";

export interface MoneyLeft {
  leftUsd: number;
  limitUsd: number;
}

export interface MoneyShort {
  what: string;
  estimateUsd: number;
  leftUsd: number;
  raiseToUsd: number;
}

export function moneyShortOf(options: {
  take: Take | undefined;
  noteCount: number;
  money: MoneyLeft | undefined;
}): MoneyShort | undefined {
  const { take, money } = options;
  if (take?.state !== "ready" || money === undefined) return undefined;
  const estimateUsd = take.nextStepEstimateUsd ?? 0;
  if (options.noteCount > 0 || estimateUsd <= money.leftUsd) return undefined;
  return {
    what: nextWorkOf(take.step),
    estimateUsd,
    leftUsd: money.leftUsd,
    raiseToUsd: raisedLimitOf({ ...money, estimateUsd }),
  };
}

export function takeOfState(state: WorkState): Take | undefined {
  return "take" in state ? state.take : undefined;
}

export function moneyActionOf(options: {
  state: WorkState;
  noteCount: number;
  money: MoneyLeft | undefined;
}): NextAction | undefined {
  const short = moneyShortOf({ ...options, take: takeOfState(options.state) });
  if (short === undefined) return undefined;
  return {
    line: `${moneyLineOf(short)} Nothing is spent until you pick.`,
    buttons: [
      {
        id: "raise",
        label: `Raise this project to $${String(short.raiseToUsd)}`,
        isPrimary: true,
      },
      { id: "fewer", label: `Make fewer ${short.what}`, isPrimary: false },
      { id: "stop-here", label: "Stop here", isPrimary: false },
    ],
  };
}
