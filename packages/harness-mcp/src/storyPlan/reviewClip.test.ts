import { describe, expect, it } from "vitest";
import { keepAnswerOf, type CriticScript } from "../testing/criticFixture.js";
import type { Harness } from "../testing/harnessFixture.js";
import {
  makeForgeSheets,
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
  await shotCall({
    harness,
    assetId: "start",
    capability: "image",
    shotId: "strike",
  });
  await shotCall({
    harness,
    assetId: "strike-clip",
    capability: "video",
    shotId: "strike",
    firstFrameAssetId: "start",
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
    faults: ["A second hammer appears in her left hand at 0.4 seconds"],
  }),
};

describe("review_clip with the critic", () => {
  it("refuses to place a clip of a shot before its review", async () => {
    const harness = await storyWithClip();

    const result = await place(harness);

    expect(result.data).toMatchObject({ kind: "clip-not-reviewed" });
  });

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
    expect(brief).toContain("7. One camera:");
    expect(brief).not.toContain("She strikes\n");
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

  it("cannot be given a verdict by the lead: the critic's redo is stored", async () => {
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
    expect(placed.data).toMatchObject({ kind: "clip-failed-review" });
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

  it("fails closed with no-critic, so a sheet stays unchecked and no shot can use it", async () => {
    const harness = await startStoryHarness({
      videoStyle: "ai-video",
      critic: "none",
    });
    await makeForgeSheets(harness);
    await setPlan({ harness, shots: [{ shot_id: "strike" }] });

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

    expect(sheet.data).toMatchObject({ kind: "no-critic" });
    expect(shot.data).toMatchObject({ kind: "sheet-not-reviewed" });
    expect(answer.isError).toBe(true);
  });
});
