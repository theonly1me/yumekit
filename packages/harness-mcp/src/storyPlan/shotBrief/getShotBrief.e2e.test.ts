import { describe, expect, it } from "vitest";
import {
  makeForgeSheets,
  makeSheet,
  setPlan,
  startStoryHarness,
} from "../../testing/storyFixture.js";

async function forgeWithBrother() {
  const harness = await startStoryHarness({ videoStyle: "ai-video" });
  await harness.call({
    name: "set_bible",
    arguments: { style: "Hand-painted 2D animation", palette: [], voice: "" },
  });
  await makeForgeSheets(harness);
  await makeSheet({
    harness,
    castId: "brother",
    kind: "person",
    facts: ["He wears a grey cloak"],
  });
  await harness.call({
    name: "put_cast_member",
    arguments: {
      cast_id: "smith",
      kind: "person",
      name: "SMITH",
      description: "The smith",
      restrictions: ["Never show both hands close up"],
    },
  });
  await setPlan({
    harness,
    shots: [{ shot_id: "strike" }, { shot_id: "gift", cast_ids: ["brother"] }],
  });
  await harness.call({
    name: "record_lesson",
    arguments: {
      lesson: "Keep the anvil large in the frame",
      cause: "The hammer missed the small anvil",
      shot_id: "strike",
    },
  });
  return harness;
}

describe("get_shot_brief", () => {
  it("gives the art direction, the facts, restrictions, and sheets of the cast of this shot only, the plan prompts, the lessons, and the model limits", async () => {
    const harness = await forgeWithBrother();

    const brief = await harness.call({
      name: "get_shot_brief",
      arguments: { shot_id: "strike" },
    });

    expect(brief.isError).toBe(false);
    expect(brief.text).toContain("Art direction: Hand-painted 2D animation");
    expect(brief.text).toContain(
      "Facts: The door is on the right wall, hinges on its left edge.",
    );
    expect(brief.text).toContain("Facts: The hammer is in her right hand.");
    expect(brief.text).toContain(
      "Restrictions: Never show both hands close up.",
    );
    expect(brief.text).toContain(
      "Sheets for reference_asset_ids of the start picture: smith-sheet.",
    );
    expect(brief.text).toContain(
      "Video prompt of the plan (11 characters): strike clip",
    );
    expect(brief.text).toContain(
      "1. Keep the anvil large in the frame (from shot strike)",
    );
    expect(brief.text).toContain("Video model ");
    expect(brief.text).not.toContain("grey cloak");
    expect(brief.data).toMatchObject({
      shot_id: "strike",
      art_direction: "Hand-painted 2D animation",
      cast: [{ cast_id: "forge" }, { cast_id: "smith" }],
      video_prompt: "strike clip",
    });
  });

  it("names the shots of the plan for an unknown shot", async () => {
    const harness = await forgeWithBrother();

    const brief = await harness.call({
      name: "get_shot_brief",
      arguments: { shot_id: "forge-fire" },
    });

    expect(brief.data).toMatchObject({ kind: "shot-not-found" });
    expect(brief.text).toContain("strike, gift");
  });
});
