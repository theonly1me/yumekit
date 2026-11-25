import { describe, expect, it } from "vitest";
import { reviewedStart } from "../testing/firstCutFixture.js";
import {
  makeForgeSheets,
  makeSheet,
  passPlan,
  setPlan,
  shotCall,
  startStoryHarness,
} from "../testing/storyFixture.js";

describe("generate_asset with the story plan", () => {
  it("makes no clip of an ai-video film with no plan, no shot, or an unknown shot", async () => {
    const harness = await startStoryHarness({ videoStyle: "ai-video" });
    const before = harness.runRequests.length;

    const noPlan = await shotCall({
      harness,
      assetId: "a",
      capability: "video",
    });
    await setPlan({ harness, shots: [{ shot_id: "strike" }] });
    const noShot = await shotCall({
      harness,
      assetId: "b",
      capability: "video",
    });
    const unknown = await shotCall({
      harness,
      assetId: "c",
      capability: "video",
      shotId: "fly",
    });

    expect(noPlan.data).toMatchObject({ kind: "story-plan-missing" });
    expect(noShot.data).toMatchObject({ kind: "shot-not-named" });
    expect(noShot.data["hint"]).toContain("strike");
    expect(unknown.data).toMatchObject({ kind: "shot-not-found" });
    expect(harness.runRequests.length).toBe(before);
  });

  it("still makes a clip that the person asks for in a graphics video with no plan", async () => {
    const harness = await startStoryHarness();

    const result = await shotCall({
      harness,
      assetId: "a",
      capability: "video",
    });

    expect(result.isError).toBe(false);
  });

  it("cannot check a plan whose place has no fixed facts, and its shot needs the facts first", async () => {
    const harness = await startStoryHarness({ videoStyle: "mix" });
    await makeSheet({
      harness,
      castId: "smith",
      kind: "person",
      facts: ["Short red hair"],
    });
    await makeSheet({ harness, castId: "forge", kind: "place", facts: [] });
    await setPlan({ harness, shots: [{ shot_id: "strike" }] });
    const before = harness.runRequests.length;

    const review = await passPlan(harness);
    const result = await shotCall({
      harness,
      assetId: "start",
      capability: "image",
      shotId: "strike",
    });

    expect(review.data).toMatchObject({ kind: "plan-incomplete" });
    expect(review.data["message"]).toContain('"forge" has no fixed facts');
    expect(result.data).toMatchObject({ kind: "cast-sheet-missing" });
    expect(harness.runRequests.length).toBe(before);
  });

  it("sends the prompts of a shot byte for byte, with no art direction, facts, lessons, or camera sentence", async () => {
    const harness = await startStoryHarness({ videoStyle: "ai-video" });
    await harness.call({
      name: "set_bible",
      arguments: { style: "Hand-painted 2D animation", palette: [], voice: "" },
    });
    await makeForgeSheets(harness);
    await setPlan({
      harness,
      shots: [{ shot_id: "strike", camera_move: "push-in" }],
    });
    await passPlan(harness);

    await reviewedStart({ harness, assetId: "start", shotId: "strike" });
    const picture = harness.runRequests.at(-1);
    await shotCall({
      harness,
      assetId: "strike-clip",
      capability: "video",
      shotId: "strike",
      firstFrameAssetId: "start",
    });
    const clip = harness.store.read().assets.at(-1);

    expect(picture?.input["prompt"]).toBe("strike start");
    expect(harness.runRequests.at(-1)?.input["prompt"]).toBe("strike clip");
    expect(clip?.source).toMatchObject({ input: { shot_id: "strike" } });
    expect(
      clip?.source.kind === "tool" ? clip.source.input : {},
    ).not.toHaveProperty("camera_move");
  });
});
