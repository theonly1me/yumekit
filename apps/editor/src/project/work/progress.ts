import type { WorkItem } from "../../chat/running/workSchema.js";
import type { Take, TakeStep } from "../takes/takeTypes.js";

export interface Progress {
  line: string;
  share: number | undefined;
}

const nouns: Record<TakeStep, [string, string]> = {
  story: ["story", "stories"],
  pictures: ["picture", "pictures"],
  clips: ["item", "clips and music"],
  cut: ["cut", "cuts"],
};

export function progressOf(options: {
  take: Take;
  work: readonly WorkItem[];
}): Progress {
  const { take } = options;
  const made = take.items.length;
  const running = options.work.filter((item) => item.kind === "media").length;
  if (take.step === "cut") {
    return {
      line:
        made > 0 ? "The cut is ready to check." : "Putting the cut together",
      share: undefined,
    };
  }
  const [one, many] = nouns[take.step];
  if (running > 0) {
    const total = made + running;
    return {
      line: `Making ${String(made)} of ${String(total)} ${many}`,
      share: made / total,
    };
  }
  return made === 0
    ? { line: `Starting take ${String(take.number)}`, share: undefined }
    : {
        line: `${String(made)} ${made === 1 ? one : many} made so far`,
        share: undefined,
      };
}
