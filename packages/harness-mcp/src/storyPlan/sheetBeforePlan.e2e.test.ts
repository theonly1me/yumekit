import { describe, expect, it } from "vitest";
import { putEntry, sheetTry } from "../testing/firstCutFixture.js";
import {
  passPlan,
  setPlan,
  shotCall,
  startStoryHarness,
} from "../testing/storyFixture.js";

describe("a sheet picture and the plan check", () => {
  it("needs a sheet picture of the place of a shot, also after a new sheet try of a person", async () => {
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
