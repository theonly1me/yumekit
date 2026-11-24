import { describe, expect, it } from "vitest";
import type { Harness } from "../testing/harnessFixture.js";
import {
  makeForgeSheets,
  setPlan,
  shotCall,
  startStoryHarness,
} from "../testing/storyFixture.js";

async function storyWithClip(): Promise<Harness> {
  const harness = await startStoryHarness({ videoStyle: "ai-video" });
  await makeForgeSheets(harness);
  await setPlan({
    harness,
    shots: [
      { shot_id: "strike" },
      {
        shot_id: "quench",
        start_state: "The blade is bent on the anvil.",
        end_state: "The blade hisses in the water.",
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

function review(options: {
  harness: Harness;
  verdict?: "keep" | "cut" | "redo";
  faults?: string[];
}) {
  return options.harness.call({
    name: "review_clip",
    arguments: {
      asset_id: "strike-clip",
      shot_id: "strike",
      ...(options.verdict === undefined ? {} : { verdict: options.verdict }),
      ...(options.faults === undefined ? {} : { faults: options.faults }),
    },
  });
}

describe("review_clip", () => {
  it("refuses to place a clip of a shot before its review", async () => {
    const harness = await storyWithClip();

    const result = await place(harness);

    expect(result.data).toMatchObject({ kind: "clip-not-reviewed" });
  });

  it("shows the frames, the measures, and the check list of the shot without storing a verdict", async () => {
    const harness = await storyWithClip();
    const revision = harness.store.read().revision;

    const result = await review({ harness });
    const texts = result.result.content.flatMap((part) =>
      part.type === "text" ? [part.text] : [],
    );

    expect(result.result.content.map((part) => part.type)).toEqual([
      "text",
      "image",
      "text",
    ]);
    expect(texts[0]).toContain("Measured motion:");
    expect(texts[1]).toContain(
      '1. Story: did this action happen and complete? "She strikes the red steel and the blade bends"',
    );
    expect(texts[1]).toContain("Five fingers on each hand");
    expect(texts[1]).toContain(
      "- FORGE: The door is on the right wall, hinges on its left edge",
    );
    expect(harness.store.read().revision).toBe(revision);
  });

  it("refuses to keep a clip that was not looked at first", async () => {
    const harness = await storyWithClip();

    const result = await review({ harness, verdict: "keep" });

    expect(result.data).toMatchObject({ kind: "clip-not-shown" });
    expect(
      harness.store.read().bible.storyPlan?.shots[0]?.reviews,
    ).toBeUndefined();
  });

  it("keeps a clip, saves its end picture, and lets it be placed", async () => {
    const harness = await storyWithClip();
    await review({ harness });

    const kept = await review({ harness, verdict: "keep" });
    const placed = await place(harness);
    const shot = harness.store.read().bible.storyPlan?.shots[0];

    expect(kept.data).toMatchObject({
      end_picture_asset_id: "strike-clip-end",
    });
    expect(shot?.reviews?.[0]).toMatchObject({
      assetId: "strike-clip",
      verdict: "keep",
      endPictureAssetId: "strike-clip-end",
    });
    expect(
      harness.store
        .read()
        .assets.find((asset) => asset.id === "strike-clip-end"),
    ).toMatchObject({ kind: "image", source: { tool: "save_end_picture" } });
    expect(placed.isError).toBe(false);
  });

  it("makes the next shot in the same place start from the end picture", async () => {
    const harness = await storyWithClip();
    await review({ harness });
    await review({ harness, verdict: "keep" });

    const unlinked = await shotCall({
      harness,
      assetId: "quench-clip",
      capability: "video",
      shotId: "quench",
      firstFrameAssetId: "start",
    });
    const linked = await shotCall({
      harness,
      assetId: "quench-clip",
      capability: "video",
      shotId: "quench",
      firstFrameAssetId: "strike-clip-end",
    });

    expect(unlinked.data).toMatchObject({ kind: "continuity-picture-missing" });
    expect(linked.isError).toBe(false);
  });

  it("refuses to place a clip whose review says redo", async () => {
    const harness = await storyWithClip();

    await review({
      harness,
      verdict: "redo",
      faults: ["The hammer changes hands at 2 seconds"],
    });
    const result = await place(harness);

    expect(result.data).toMatchObject({ kind: "clip-failed-review" });
    expect(result.data["message"]).toContain(
      "The hammer changes hands at 2 seconds",
    );
  });
});
