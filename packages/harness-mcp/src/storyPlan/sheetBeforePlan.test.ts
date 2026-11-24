import { describe, expect, it } from "vitest";
import { passSheetAnswerOf } from "../testing/criticFixture.js";
import { putEntry, sheetTry, useSheet } from "../testing/firstCutFixture.js";
import {
  passPlan,
  setPlan,
  shotCall,
  startStoryHarness,
} from "../testing/storyFixture.js";

describe("a sheet picture and the plan check", () => {
  it("makes a sheet picture before the plan check, and the sheet keeps its try count after it", async () => {
    const harness = await startStoryHarness({
      videoStyle: "ai-video",
      critic: {
        sheet: () => ({
          ...passSheetAnswerOf(),
          verdict: "fail",
          faults: ["The fingers of the right hand merge"],
        }),
      },
    });
    await putEntry({ harness, castId: "forge" });
    await putEntry({ harness, castId: "smith" });
    await setPlan({ harness, shots: [{ shot_id: "strike" }] });

    const early = await sheetTry({ harness, castId: "smith", assetId: "s1" });
    await useSheet({ harness, castId: "smith", assetIds: ["s1"] });
    await passPlan(harness);
    const fromNothing = await sheetTry({
      harness,
      castId: "smith",
      assetId: "s2",
      prompt: "A smith, again",
    });

    expect(early.isError).toBe(false);
    expect(harness.runRequests).toHaveLength(1);
    expect(fromNothing.data).toMatchObject({ kind: "start-from-refused" });
  });

  it("keeps a sheet waiting for the plan check while its entry has no sheet_prompts", async () => {
    const harness = await startStoryHarness({ videoStyle: "ai-video" });
    await putEntry({ harness, castId: "forge" });
    await harness.call({
      name: "put_cast_member",
      arguments: {
        cast_id: "smith",
        kind: "person",
        name: "SMITH",
        description: "The smith",
        facts: ["The hammer is in her right hand"],
      },
    });
    await setPlan({ harness, shots: [{ shot_id: "strike" }] });

    const early = await sheetTry({
      harness,
      castId: "smith",
      assetId: "s1",
      prompt: "A smith",
    });

    expect(early.data).toMatchObject({ kind: "plan-not-reviewed" });
  });

  it("keeps the plan check current after a new sheet try, its prompts, or a restriction", async () => {
    const harness = await startStoryHarness({ videoStyle: "ai-video" });
    await putEntry({ harness, castId: "forge" });
    await putEntry({ harness, castId: "smith" });
    await setPlan({ harness, shots: [{ shot_id: "strike" }] });
    await passPlan(harness);

    await sheetTry({ harness, castId: "smith", assetId: "s1" });
    await putEntry({
      harness,
      castId: "smith",
      extra: {
        reference_asset_ids: ["s1"],
        sheet_prompts: ["smith sheet, the second try"],
        restrictions: ["Never show both of her hands close up"],
      },
    });
    const start = await shotCall({
      harness,
      assetId: "strike-start",
      capability: "image",
      shotId: "strike",
    });

    expect(start.data).toMatchObject({ kind: "cast-sheet-missing" });
  });
});
