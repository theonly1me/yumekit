import { describe, expect, it } from "vitest";
import { reviewedStart } from "../testing/firstCutFixture.js";
import {
  makeForgeSheets,
  passPlan,
  setPlan,
  shotCall,
  startStoryHarness,
} from "../testing/storyFixture.js";
import { firstFrameSentence } from "./promptAdditions.js";

describe("a clip that starts on its start picture", () => {
  it("sends the start picture as the only picture, with the short motion prompt and no sheets, facts, or art direction", async () => {
    const harness = await startStoryHarness({ videoStyle: "ai-video" });
    await harness.call({
      name: "set_bible",
      arguments: { style: "Hand-painted 2D animation", palette: [], voice: "" },
    });
    await makeForgeSheets(harness);
    await setPlan({ harness, shots: [{ shot_id: "strike" }] });
    await passPlan(harness);
    await reviewedStart({ harness, assetId: "start", shotId: "strike" });

    const withSheets = await shotCall({
      harness,
      assetId: "clip",
      capability: "video",
      shotId: "strike",
      firstFrameAssetId: "start",
      extra: { reference_asset_ids: ["smith-sheet"] },
    });
    const clip = await shotCall({
      harness,
      assetId: "clip",
      capability: "video",
      shotId: "strike",
      firstFrameAssetId: "start",
    });
    const sent = harness.runRequests.at(-1)?.input ?? {};

    expect(withSheets.data).toMatchObject({ kind: "first-frame-only" });
    expect(clip.isError).toBe(false);
    expect(sent["first_frame_path"]).toContain("start.png");
    expect(sent).not.toHaveProperty("reference_image_paths");
    expect(sent["prompt"]).toBe(`strike clip\n\n${firstFrameSentence}`);
  });

  it("needs a passed review of the start picture before its clip, and warns about a long video prompt in the plan", async () => {
    const harness = await startStoryHarness({ videoStyle: "ai-video" });
    await makeForgeSheets(harness);
    const plan = await setPlan({
      harness,
      shots: [
        { shot_id: "strike", video_prompt: "The hammer falls.".repeat(100) },
      ],
    });
    await passPlan(harness);
    await shotCall({
      harness,
      assetId: "start",
      capability: "image",
      shotId: "strike",
    });

    const clip = await shotCall({
      harness,
      assetId: "clip",
      capability: "video",
      shotId: "strike",
      firstFrameAssetId: "start",
    });

    expect(plan.text).toContain(
      'The video prompt of shot "strike" has 1700 characters. Keep it under 1500',
    );
    expect(clip.data).toMatchObject({ kind: "start-not-reviewed" });
  });
});
