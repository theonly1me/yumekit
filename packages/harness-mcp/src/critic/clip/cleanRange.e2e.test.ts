import { describe, expect, it } from "vitest";
import { keepAnswerOf } from "../../testing/criticFixture.js";
import type { Harness } from "../../testing/harnessFixture.js";
import {
  makeForgeSheets,
  setPlan,
  startStoryHarness,
} from "../../testing/storyFixture.js";

const lateFault = {
  fault: "A second hammer appears in her left hand",
  from_seconds: 3,
  to_seconds: 4,
};

async function reviewedWith(verdict: "cut" | "redo"): Promise<{
  harness: Harness;
  review: Awaited<ReturnType<Harness["call"]>>;
}> {
  const harness = await startStoryHarness({
    videoStyle: "ai-video",
    critic: {
      clip: (brief) => ({
        ...keepAnswerOf(brief),
        verdict,
        faults: [lateFault],
      }),
    },
  });
  await makeForgeSheets(harness);
  await setPlan({ harness, shots: [{ shot_id: "strike" }] });
  await harness.call({
    name: "generate_asset",
    arguments: {
      asset_id: "strike-clip",
      capability: "video",
      shot_id: "strike",
      input: { duration_seconds: 4 },
    },
  });
  const review = await harness.call({
    name: "review_clip",
    arguments: { asset_id: "strike-clip", shot_id: "strike" },
  });
  return { harness, review };
}

describe(
  "the clean range of a clip from the seconds of its faults",
  { timeout: 120_000 },
  () => {
    it("gives a cut the longest part with no fault as its clean range", async () => {
      const { harness, review } = await reviewedWith("cut");
      const [stored] =
        harness.store.read().bible.storyPlan?.shots[0]?.reviews ?? [];

      expect(review.data).toMatchObject({
        verdict: "cut",
        keep_from_seconds: 0,
        keep_to_seconds: 3,
      });
      expect(review.text).toContain("Place only the clean part, 0s to 3s.");
      expect(stored?.faults).toEqual([
        "A second hammer appears in her left hand (3s to 4s)",
      ]);
    });

    it("refuses a redo whose faults leave a clean part of at least 1.2 seconds with the action", async () => {
      const { harness, review } = await reviewedWith("redo");

      expect(harness.criticLog.answers.at(-1)?.isError).toBe(true);
      expect(harness.criticLog.answers.at(-1)?.text).toContain(
        "The faults leave a clean part from 0s to 3s that holds the action. That is a cut",
      );
      expect(review.isError).toBe(true);
    });
  },
);
