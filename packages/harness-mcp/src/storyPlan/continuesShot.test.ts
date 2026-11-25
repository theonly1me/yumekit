import { describe, expect, it } from "vitest";
import { keepAnswerOf } from "../testing/criticFixture.js";
import type { Harness } from "../testing/harnessFixture.js";
import { planAnswerWith } from "../testing/planCritic.js";
import {
  makeForgeSheets,
  makeSheet,
  passPlan,
  setPlan,
  shotCall,
  startStoryHarness,
} from "../testing/storyFixture.js";

async function calibratedForge(options: { quenchContinues: boolean }) {
  const harness = await startStoryHarness({
    videoStyle: "ai-video",
    critic: {
      plan: (brief) =>
        planAnswerWith({ brief, easiest: "cool", hardest: "polish" }),
      clip: keepAnswerOf,
    },
  });
  await harness.call({ name: "set_checks", arguments: { checks: "critic" } });
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
        ...(options.quenchContinues ? { continues_shot: "strike" } : {}),
      },
      { shot_id: "cool", place_id: "yard" },
      { shot_id: "polish", place_id: "yard" },
    ],
  });
  await passPlan(harness);
  for (const shotId of ["cool", "polish"]) {
    await keptClip({ harness, shotId });
  }
  return harness;
}

async function keptClip(options: { harness: Harness; shotId: string }) {
  const { harness, shotId } = options;
  await shotCall({
    harness,
    assetId: `${shotId}-clip`,
    capability: "video",
    shotId,
  });
  await harness.call({
    name: "review_clip",
    arguments: { asset_id: `${shotId}-clip`, shot_id: shotId },
  });
}

describe("a shot that continues another shot, and a cut", () => {
  it("makes a shot with continues_shot wait for the checked clip of that shot, names it, then starts from its end", async () => {
    const harness = await calibratedForge({ quenchContinues: true });

    const early = await shotCall({
      harness,
      assetId: "quench-start",
      capability: "image",
      shotId: "quench",
    });
    await keptClip({ harness, shotId: "strike" });
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

    expect(early.data).toMatchObject({
      kind: "waits-for-shot",
      waits_for_shot: "strike",
    });
    expect(early.data["message"]).toContain('waits for shot "strike"');
    expect(unlinked.data).toMatchObject({ kind: "continuity-picture-missing" });
    expect(linked.isError).toBe(false);
  });

  it("names the next batch in get_work, and the shot that each other shot waits for", async () => {
    const harness = await calibratedForge({ quenchContinues: true });

    const work = await harness.call({ name: "get_work" });

    expect(work.text).toContain(
      'Next batch: the start pictures. Ready: "strike".',
    );
    expect(work.text).toContain(
      'Waiting: "quench" waits for the checked clip of "strike" (continues_shot).',
    );
  });

  it("lets a cut in the same place start on its own picture at once, with a note", async () => {
    const harness = await calibratedForge({ quenchContinues: false });
    await keptClip({ harness, shotId: "strike" });

    const cut = await shotCall({
      harness,
      assetId: "quench-start",
      capability: "image",
      shotId: "quench",
    });

    expect(cut.isError).toBe(false);
    expect(cut.text).toContain(
      'starts on its own start picture, as a cut to a new camera position. If it continues the last frame of "strike"',
    );
  });

  it("refuses a plan whose continues_shot names no earlier shot", async () => {
    const harness = await startStoryHarness({ videoStyle: "ai-video" });
    await makeForgeSheets(harness);

    const refused = await setPlan({
      harness,
      shots: [
        { shot_id: "strike", continues_shot: "quench" },
        { shot_id: "quench" },
      ],
    });

    expect(refused.data).toMatchObject({ kind: "invalid-value" });
  });
});
