import { describe, expect, it } from "vitest";
import { keepAnswerOf, type CriticScript } from "../testing/criticFixture.js";
import type { Harness } from "../testing/harnessFixture.js";
import {
  makeForgeSheets,
  passPlan,
  setPlan,
  shotCall,
  startStoryHarness,
} from "../testing/storyFixture.js";

async function storyWithClip(critic?: CriticScript): Promise<Harness> {
  const harness = await startStoryHarness({
    videoStyle: "ai-video",
    ...(critic === undefined ? {} : { critic }),
  });
  await makeForgeSheets(harness);
  await setPlan({
    harness,
    shots: [
      { shot_id: "strike" },
      {
        shot_id: "quench",
        start: [{ cast_id: "smith", state: "the blade is bent" }],
        end: [{ cast_id: "smith", state: "the blade hisses in the water" }],
      },
    ],
  });
  await passPlan(harness);
  await shotCall({
    harness,
    assetId: "strike-clip",
    capability: "video",
    shotId: "strike",
  });
  return harness;
}

function place(harness: Harness) {
  return harness.call({
    name: "place_video",
    arguments: { output_id: "wide", asset_id: "strike-clip", start_frame: 0 },
  });
}

function review(harness: Harness) {
  return harness.call({
    name: "review_clip",
    arguments: { asset_id: "strike-clip", shot_id: "strike" },
  });
}

const redoCritic: CriticScript = {
  clip: (brief) => ({
    ...keepAnswerOf(brief),
    counts: [{ object: "hammers", expected: 1, seen: 2, seconds: 0.4 }],
    verdict: "redo",
    faults: [
      {
        fault: "A second hammer appears in her left hand",
        from_seconds: 0.4,
        to_seconds: 1,
      },
    ],
  }),
};

describe("review_clip with the critic", () => {
  it("gives the critic the shot, the facts, and the list, and never the prompt of the clip", async () => {
    const harness = await storyWithClip();

    await review(harness);
    const [brief = ""] = harness.criticLog.briefs.slice(-1);

    expect(brief).toContain(
      "- Action: She hammers the red steel and the blade bends",
    );
    expect(brief).toContain(
      "The door is on the right wall, hinges on its left edge",
    );
    expect(brief).toContain("8. One camera:");
    expect(brief).not.toContain("strike clip");
  });

  it("stores the keep of the critic, saves the end picture, and lets the clip be placed", async () => {
    const harness = await storyWithClip();

    const kept = await review(harness);
    const placed = await place(harness);
    const shot = harness.store.read().bible.storyPlan?.shots[0];

    expect(kept.data).toMatchObject({
      verdict: "keep",
      end_picture_asset_id: "strike-clip-end",
    });
    expect(shot?.reviews?.[0]).toMatchObject({
      assetId: "strike-clip",
      verdict: "keep",
      by: "critic",
    });
    expect(placed.isError).toBe(false);
  });

  it("stores the redo of the critic, and the redo with no break of the design does not block place_video", async () => {
    const harness = await storyWithClip(redoCritic);

    const result = await harness.call({
      name: "review_clip",
      arguments: {
        asset_id: "strike-clip",
        shot_id: "strike",
        verdict: "keep",
        faults: [],
      },
    });
    const placed = await place(harness);

    expect(result.data).toMatchObject({ verdict: "redo" });
    expect(result.data["faults"]).toContain("2 hammers, not 1 at 0.4s");
    expect(result.data["faults"]).toContain(
      "A second hammer appears in her left hand (0.4s to 1s)",
    );
    expect(placed.isError).toBe(false);
  });

  it("refuses a keep from the critic while a count differs or the end did not happen", async () => {
    const harness = await storyWithClip({
      clip: (brief) => ({
        ...keepAnswerOf(brief),
        counts: [{ object: "swords", expected: 1, seen: 2, seconds: 0.8 }],
        action: { happened: false, seen: "She never strikes." },
      }),
    });

    const result = await review(harness);
    const refused = harness.criticLog.answers.at(-1);

    expect(refused?.isError).toBe(true);
    expect(refused?.text).toContain("The count of swords differs");
    expect(refused?.text).toContain("The action did not happen");
    expect(result.data).toMatchObject({ kind: "critic-failed" });
    expect(
      harness.store.read().bible.storyPlan?.shots[0]?.reviews,
    ).toBeUndefined();
  });

  it("answers no-critic for each review when no critic runs, and the shots still run", async () => {
    const harness = await startStoryHarness({
      videoStyle: "ai-video",
      critic: "none",
    });
    await makeForgeSheets(harness);
    await setPlan({ harness, shots: [{ shot_id: "strike" }] });

    const plan = await passPlan(harness);
    const sheet = await harness.call({
      name: "review_sheet",
      arguments: { cast_id: "smith" },
    });
    const shot = await shotCall({
      harness,
      assetId: "start",
      capability: "image",
      shotId: "strike",
    });
    const answer = await harness.call({
      name: "give_clip_review",
      arguments: keepAnswerOf("- End entries to judge: smith"),
    });

    expect(plan.data).toMatchObject({ kind: "no-critic" });
    expect(sheet.data).toMatchObject({ kind: "no-critic" });
    expect(shot.isError).toBe(false);
    expect(answer.isError).toBe(true);
  });
});
