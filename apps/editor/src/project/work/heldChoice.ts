import type { ViewChoice } from "./workState.js";

export interface HeldChoice {
  choice: ViewChoice;
  newestTakeId: string | undefined;
}

export const autoChoice: ViewChoice = { kind: "auto" };

export function choiceInForceOf(options: {
  held: HeldChoice;
  newestTakeId: string | undefined;
}): ViewChoice {
  return options.held.newestTakeId === options.newestTakeId
    ? options.held.choice
    : autoChoice;
}
