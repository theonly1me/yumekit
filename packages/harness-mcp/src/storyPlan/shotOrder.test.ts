import { describe, expect, it } from "vitest";
import { keepAnswerOf, passSheetAnswerOf } from "../testing/criticFixture.js";
import { planAnswerWith } from "../testing/planCritic.js";
import {
  makeForgeSheets,
  makeSheet,
  passPlan,
  setPlan,
  shotCall,
  startStoryHarness,
} from "../testing/storyFixture.js";

describe("the order of a story film", () => {
  it("refuses a shot whose prop sheet the critic failed", async () => {
    const harness = await startStoryHarness({
      videoStyle: "ai-video",
      critic: {
        sheet: (brief) =>
          brief.includes('"hammer"')
            ? {
                ...passSheetAnswerOf(),
                counts: [{ object: "hammers", expected: 1, seen: 2 }],
                verdict: "fail",
                faults: ["The sheet draws two hammers"],
              }
            : passSheetAnswerOf(),
      },
    });
    await makeForgeSheets(harness);
    await makeSheet({
      harness,
      castId: "hammer",
      kind: "prop",
      facts: ["Exactly one hammer"],
    });
    await setPlan({
      harness,
      shots: [{ shot_id: "strike", cast_ids: ["smith", "hammer"] }],
    });
    await passPlan(harness);

    const result = await shotCall({
      harness,
      assetId: "start",
      capability: "image",
      shotId: "strike",
    });

    expect(result.data).toMatchObject({ kind: "sheet-failed-review" });
    expect(result.data["message"]).toContain("The sheet draws two hammers");
  });

  it("needs a picture of the hands for a person who holds a prop in the plan", async () => {
    const harness = await startStoryHarness({ videoStyle: "ai-video" });
    await makeForgeSheets(harness);
    await makeSheet({
      harness,
      castId: "hammer",
      kind: "prop",
      facts: ["Exactly one hammer"],
    });
    const held = {
      cast_id: "hammer",
      held_by: { cast_id: "smith", hand: "right" as const },
    };
    await setPlan({
      harness,
      shots: [
        {
          shot_id: "strike",
          cast_ids: ["smith", "hammer"],
          start: [{ cast_id: "smith" }, held],
          end: [{ cast_id: "smith", state: "the blade is bent" }, held],
        },
      ],
    });
    await passPlan(harness);

    const result = await shotCall({
      harness,
      assetId: "start",
      capability: "image",
      shotId: "strike",
    });

    expect(result.data).toMatchObject({ kind: "cast-sheet-missing" });
    expect(result.data["message"]).toContain(
      '"smith" has no picture of the hands holding hammer',
    );
  });

  it("makes the next shot in the same place wait for the kept clip before it, then start from its end", async () => {
    const harness = await startStoryHarness({
      videoStyle: "ai-video",
      critic: {
        plan: (brief) =>
          planAnswerWith({ brief, easiest: "cool", hardest: "polish" }),
        clip: (brief) =>
          brief.includes('"polish-clip"')
            ? { ...keepAnswerOf(brief), verdict: "redo", faults: ["A jump"] }
            : keepAnswerOf(brief),
      },
    });
    await makeForgeSheets(harness);
    await makeSheet({
      harness,
      castId: "yard",
      kind: "place",
      facts: ["The water trough is by the wall"],
    });
    await setPlan({
      harness,
      shots: [
        { shot_id: "strike" },
        {
          shot_id: "quench",
          start: [{ cast_id: "smith", state: "the blade is bent" }],
          end: [{ cast_id: "smith", state: "the blade hisses" }],
        },
        { shot_id: "cool", place_id: "yard" },
        { shot_id: "polish", place_id: "yard" },
      ],
    });
    await passPlan(harness);
    for (const shotId of ["cool", "polish"]) {
      await shotCall({
        harness,
        assetId: `${shotId}-clip`,
        capability: "video",
        shotId,
        ...(shotId === "polish" ? { firstFrameAssetId: "cool-clip-end" } : {}),
      });
      await harness.call({
        name: "review_clip",
        arguments: { asset_id: `${shotId}-clip`, shot_id: shotId },
      });
    }

    await harness.call({
      name: "record_lesson",
      arguments: {
        lesson: "Keep the trough large in the frame",
        cause: "The clip jumped",
        shot_id: "polish",
      },
    });
    const early = await shotCall({
      harness,
      assetId: "quench-start",
      capability: "image",
      shotId: "quench",
    });
    await shotCall({
      harness,
      assetId: "strike-clip",
      capability: "video",
      shotId: "strike",
    });
    await harness.call({
      name: "review_clip",
      arguments: { asset_id: "strike-clip", shot_id: "strike" },
    });
    const unlinked = await shotCall({
      harness,
      assetId: "quench-clip",
      capability: "video",
      shotId: "quench",
      firstFrameAssetId: "cool-clip-end",
    });
    const linked = await shotCall({
      harness,
      assetId: "quench-clip",
      capability: "video",
      shotId: "quench",
      firstFrameAssetId: "strike-clip-end",
    });

    expect(early.data).toMatchObject({ kind: "previous-shot-not-kept" });
    expect(unlinked.data).toMatchObject({ kind: "continuity-picture-missing" });
    expect(linked.isError).toBe(false);
  });
});
