import { seededRandom } from "@yumekit/scene";
import { replaceProperty } from "./replaceProperty.js";

export function seedMathRandom(): {
  seed: (seed: string) => void;
  restore: () => void;
} {
  let nextRandom = seededRandom("");
  const restore = replaceProperty({
    target: Math,
    key: "random",
    value: () => nextRandom(),
  });
  return {
    seed: (seed) => {
      nextRandom = seededRandom(seed);
    },
    restore,
  };
}
