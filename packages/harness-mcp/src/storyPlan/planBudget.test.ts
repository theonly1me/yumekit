import { describe, expect, it } from "vitest";
import { putEntry } from "../testing/firstCutFixture.js";
import { startHarness } from "../testing/harnessFixture.js";
import { startPricedHarness } from "../testing/pricedFixture.js";
import { setPlan } from "../testing/storyFixture.js";
import { sampleWithVideoLimit } from "../testing/videoFixture.js";

const sevenShots = ["a", "b", "c", "d", "e", "f", "g"].map((letter) => ({
  shot_id: `shot-${letter}`,
}));

describe("the warning before the money of a plan", () => {
  it("warns in set_story_plan when the shots and one retry of the two longest pass the video seconds limit", async () => {
    const harness = await startHarness({
      mediaToolsFile: sampleWithVideoLimit(30),
    });
    await putEntry({ harness, castId: "forge" });
    await putEntry({ harness, castId: "smith" });

    const saved = await setPlan({ harness, shots: sevenShots });

    expect(saved.data["budget_warnings"]).toEqual([
      "The 7 shots of the plan have 28 seconds of video. With one retry of the two longest shots (8 seconds more), the film needs about 36 seconds, and the limit of the project is 30 seconds of generated video. Only the person can raise a limit, in Settings. The AI cannot.",
    ]);
    expect(saved.text).toContain("Before the money: The 7 shots");
  });

  it("warns when the cost estimate with the strongest picture model passes the spending limit, and stores the estimate", async () => {
    const { harness } = await startPricedHarness({ spendingUsd: 5 });
    await putEntry({ harness, castId: "forge" });
    await putEntry({ harness, castId: "smith" });

    const saved = await setPlan({
      harness,
      shots: [{ shot_id: "strike" }, { shot_id: "quench" }],
    });

    expect(saved.data["cost_estimate_usd"]).toBe(9.6);
    expect(saved.data["budget_warnings"]).toEqual([
      "The plan costs about $9.60 with that retry, and the spending limit of the project is $5.00. Only the person can raise a limit, in Settings. The AI cannot.",
    ]);
    expect(harness.store.read().bible.storyPlan?.costEstimateUsd).toBe(9.6);
  });
});
