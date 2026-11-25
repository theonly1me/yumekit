import { describe, expect, it } from "vitest";
import { keepAnswerOf, passSheetAnswerOf } from "../testing/criticFixture.js";
import { reviewedStart } from "../testing/firstCutFixture.js";
import type { Harness } from "../testing/harnessFixture.js";
import {
  makeForgeSheets,
  passPlan,
  setPlan,
  shotCall,
  startStoryHarness,
} from "../testing/storyFixture.js";

function clipOf(options: { harness: Harness; shotId: string }) {
  return shotCall({
    harness: options.harness,
    assetId: `${options.shotId}-clip`,
    capability: "video",
    shotId: options.shotId,
  });
}

function reviewOf(options: { harness: Harness; shotId: string }) {
  return options.harness.call({
    name: "review_clip",
    arguments: {
      asset_id: `${options.shotId}-clip`,
      shot_id: options.shotId,
    },
  });
}

describe("the tries of a shot", () => {
  it("calibrates on the easiest and the hardest shot, turns a refusal into a lesson for the lead and never for the model, and does not block the next shot", async () => {
    const harness = await startStoryHarness({
      videoStyle: "ai-video",
      critic: {
        clip: (brief) =>
          brief.includes('"strike-clip"')
            ? {
                ...keepAnswerOf(brief),
                verdict: "redo",
                faults: ["The hammer misses"],
              }
            : keepAnswerOf(brief),
      },
    });
    await makeForgeSheets(harness);
    await setPlan({
      harness,
      shots: [
        { shot_id: "strike" },
        { shot_id: "quench" },
        { shot_id: "temper" },
      ],
    });
    await passPlan(harness);

    const early = await clipOf({ harness, shotId: "quench" });
    for (const shotId of ["strike", "temper"]) {
      await clipOf({ harness, shotId });
      await reviewOf({ harness, shotId });
    }
    const unlearned = await clipOf({ harness, shotId: "quench" });
    await harness.call({
      name: "record_lesson",
      arguments: {
        lesson: "Keep the anvil large in the frame",
        cause: "The hammer missed the small anvil",
        shot_id: "strike",
      },
    });
    const next = await clipOf({ harness, shotId: "quench" });
    const prompt = harness.runRequests.at(-1)?.input["prompt"];
    await reviewOf({ harness, shotId: "quench" });
    const briefs = harness.criticLog.briefs.length;
    const again = await reviewOf({ harness, shotId: "quench" });
    const work = await harness.call({ name: "get_work" });

    expect(early.data).toMatchObject({ kind: "calibrate-first" });
    expect(unlearned.data).toMatchObject({ kind: "lessons-missing" });
    expect(next.isError).toBe(false);
    expect(prompt).toBe("quench clip");
    expect(next.text).toContain(
      "1. Keep the anvil large in the frame (from shot strike)",
    );
    expect(next.data["lessons_for_you"]).toEqual([
      expect.objectContaining({ lesson: "Keep the anvil large in the frame" }),
    ]);
    expect(again.data).toMatchObject({ verdict: "keep", stored: true });
    expect(harness.criticLog.briefs).toHaveLength(briefs);
    expect(work.text).toContain(
      "Measure: 2 of 3 shots accepted on the first try.",
    );
    expect(work.text).toContain(
      "Tries of each shot: strike 1, quench 1 (accepted), temper 1 (accepted).",
    );
  });

  it("starts the second try from the refused start picture, and asks for a simpler form after two refusals", async () => {
    const harness = await startStoryHarness({
      videoStyle: "ai-video",
      critic: {
        start: () => ({
          ...passSheetAnswerOf(),
          verdict: "fail",
          faults: ["The hand at the top edge is a lump"],
        }),
      },
    });
    await makeForgeSheets(harness);
    await setPlan({ harness, shots: [{ shot_id: "strike" }] });
    await passPlan(harness);

    await reviewedStart({ harness, assetId: "start-1", shotId: "strike" });
    const clip = await shotCall({
      harness,
      assetId: "clip",
      capability: "video",
      shotId: "strike",
      firstFrameAssetId: "start-1",
    });
    const fresh = await reviewedStart({
      harness,
      assetId: "start-2",
      shotId: "strike",
      extra: {
        input: { prompt: "A new smith", width_pixels: 32, height_pixels: 18 },
      },
    });
    await reviewedStart({
      harness,
      assetId: "start-2",
      shotId: "strike",
      extra: {
        input: {
          prompt: "Change only the hand",
          width_pixels: 32,
          height_pixels: 18,
        },
        reference_asset_ids: ["start-1"],
      },
    });
    const third = await reviewedStart({
      harness,
      assetId: "start-3",
      shotId: "strike",
      extra: {
        input: { prompt: "Simpler", width_pixels: 32, height_pixels: 18 },
      },
    });

    expect(clip.data).toMatchObject({ kind: "start-failed-review" });
    expect(fresh.data).toMatchObject({ kind: "start-from-refused" });
    expect(third.data).toMatchObject({ kind: "simplify-first" });
  });
});
