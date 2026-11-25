import { describe, expect, it } from "vitest";
import { reviewedStart } from "../testing/firstCutFixture.js";
import { startHarness } from "../testing/harnessFixture.js";
import {
  makeForgeSheets,
  passPlan,
  setPlan,
  shotCall,
  startStoryHarness,
} from "../testing/storyFixture.js";

describe("the prompt as sent", () => {
  it("answers a clip of a shot with the prompt exactly as written and the lessons as a block for the lead", async () => {
    const harness = await startStoryHarness({ videoStyle: "ai-video" });
    await harness.call({
      name: "set_bible",
      arguments: { style: "Hand-painted 2D animation", palette: [], voice: "" },
    });
    await makeForgeSheets(harness);
    await setPlan({ harness, shots: [{ shot_id: "strike" }] });
    await passPlan(harness);
    const lesson = await harness.call({
      name: "record_lesson",
      arguments: {
        lesson: "For the crawler on all fours, state where each hand is",
        cause: "The crawler grew a third arm",
      },
    });
    await reviewedStart({ harness, assetId: "start", shotId: "strike" });

    const clip = await shotCall({
      harness,
      assetId: "clip",
      capability: "video",
      shotId: "strike",
      firstFrameAssetId: "start",
    });
    const work = await harness.call({ name: "get_work" });

    expect(harness.runRequests.at(-1)?.input["prompt"]).toBe("strike clip");
    expect(clip.data).toMatchObject({
      prompt_from_you: "strike clip",
      prompt_characters: 11,
      lessons_for_you: [
        {
          lesson: "For the crawler on all fours, state where each hand is",
          cause: "The crawler grew a third arm",
          is_limit: false,
        },
      ],
    });
    expect(clip.data).not.toHaveProperty("added_by_yumekit");
    expect(clip.text).toContain(
      "The prompt for the model is exactly as you wrote it: 11 characters. yumekit added nothing.",
    );
    expect(clip.text).toContain(
      "yumekit sends no lesson to a picture or video model.",
    );
    expect(lesson.data["lessons_for_you"]).toHaveLength(1);
    expect(lesson.text).toContain(
      "1. For the crawler on all fours, state where each hand is",
    );
    expect(work.text).toContain("read get_shot_brief");
  });

  it("notes a video prompt over 900 characters and still makes the clip", async () => {
    const harness = await startHarness();
    const prompt =
      `A fox runs across the snow. ${"Its tail streams behind it. ".repeat(33)}`.trim();

    const clip = await harness.call({
      name: "generate_asset",
      arguments: {
        asset_id: "fox",
        capability: "video",
        input: { prompt, duration_seconds: 1 },
      },
    });

    expect(prompt.length).toBeGreaterThan(900);
    expect(clip.isError).toBe(false);
    expect(harness.runRequests.at(-1)?.input["prompt"]).toBe(prompt);
    expect(clip.text).toContain(
      `The video prompt has ${String(prompt.length)} characters. Keep it under 900`,
    );
  });
});
