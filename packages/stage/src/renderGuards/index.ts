import { fixClock } from "./fixedClock.js";
import { turnOffCssMotion } from "./motionOff.js";
import { blockNetwork } from "./networkOff.js";
import { seedMathRandom } from "./seededMathRandom.js";

export interface RenderGuards {
  seedRandom: (seed: string) => void;
  remove: () => void;
}

export const noGuards: RenderGuards = {
  seedRandom: () => undefined,
  remove: () => undefined,
};

export function installRenderGuards(): RenderGuards {
  const random = seedMathRandom();
  const removeSteps = [
    fixClock(),
    random.restore,
    turnOffCssMotion(),
    blockNetwork(),
  ];
  return {
    seedRandom: random.seed,
    remove: () => {
      for (const remove of removeSteps.toReversed()) {
        remove();
      }
    },
  };
}
