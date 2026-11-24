import { describe, expect, it } from "vitest";
import {
  makeForgeSheets,
  makeSheet,
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

  it("refuses a shot whose place has no fixed facts", async () => {
    const harness = await startStoryHarness({ videoStyle: "mix" });
    await makeSheet({
      harness,
      castId: "smith",
      kind: "person",
      facts: ["Short red hair"],
    });
    await makeSheet({ harness, castId: "forge", kind: "place", facts: [] });
    await setPlan({ harness, shots: [{ shot_id: "strike" }] });

    const result = await shotCall({
      harness,
      assetId: "start",
      capability: "image",
      shotId: "strike",
    });

    expect(result.data).toMatchObject({ kind: "cast-sheet-missing" });
    expect(result.data["message"]).toContain('"forge" has no fixed facts');
  });

  it("sends the art direction, the facts of the place and the cast, and the camera of the shot", async () => {
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

    await shotCall({
      harness,
      assetId: "start",
      capability: "image",
      shotId: "strike",
    });
    const picture = harness.runRequests.at(-1);
    await shotCall({
      harness,
      assetId: "strike-clip",
      capability: "video",
      shotId: "strike",
      firstFrameAssetId: "start",
    });
    const clip = harness.store.read().assets.at(-1);

    expect(picture?.input["prompt"]).toBe(
      "She strikes\n\nArt direction: Hand-painted 2D animation.\n\nFORGE: The forge. Fixed: The door is on the right wall, hinges on its left edge. SMITH: The smith. Fixed: The hammer is in her right hand.",
    );
    expect(clip?.source).toMatchObject({
      input: { shot_id: "strike", camera_move: "push-in" },
    });
  });
});
