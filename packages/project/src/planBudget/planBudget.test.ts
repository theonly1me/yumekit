import { describe, expect, it } from "vitest";
import { planBudgetOf } from "./index.js";

const trailerShots = [3, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 3, 3].map(
  (seconds) => ({ seconds }),
);

describe("the money and the seconds of a plan before any paid call", () => {
  it("warns when the planned seconds and one retry of the two longest shots pass the video limit", () => {
    const budget = planBudgetOf({
      shots: trailerShots,
      estimateUsd: undefined,
      limitSeconds: 30,
      limitUsd: 5,
    });

    expect(budget.plannedSeconds).toBe(31);
    expect(budget.retrySeconds).toBe(6);
    expect(budget.warnings).toEqual([
      "The 14 shots of the plan have 31 seconds of video. With one retry of the two longest shots (6 seconds more), the film needs about 37 seconds, and the limit of the project is 30 seconds of generated video. Only the person can raise a limit, in Settings. The AI cannot.",
    ]);
  });

  it("warns when the cost estimate passes the spending limit", () => {
    const budget = planBudgetOf({
      shots: [{ seconds: 4 }],
      estimateUsd: 6.5,
      limitSeconds: 30,
      limitUsd: 5,
    });

    expect(budget.warnings).toEqual([
      "The plan costs about $6.50 with that retry, and the spending limit of the project is $5.00. Only the person can raise a limit, in Settings. The AI cannot.",
    ]);
  });

  it("gives no warning for a plan inside both limits", () => {
    const budget = planBudgetOf({
      shots: [{ seconds: 4 }, { seconds: 6 }],
      estimateUsd: 2,
      limitSeconds: 30,
      limitUsd: 5,
    });

    expect(budget.neededSeconds).toBe(20);
    expect(budget.warnings).toEqual([]);
  });
});
