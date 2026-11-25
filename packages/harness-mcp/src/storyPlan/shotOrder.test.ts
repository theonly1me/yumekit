import { describe, expect, it } from "vitest";
import { passSheetAnswerOf } from "../testing/criticFixture.js";
import {
  makeForgeSheets,
  makeSheet,
  passPlan,
  setPlan,
  shotCall,
  startStoryHarness,
} from "../testing/storyFixture.js";

describe("the order of a story film", () => {
  it("refuses a shot whose prop sheet the critic failed", async () => {
    const harness = await startStoryHarness({
      videoStyle: "ai-video",
      critic: {
        sheet: (brief) =>
          brief.includes('"hammer"')
            ? {
                ...passSheetAnswerOf(),
                counts: [{ object: "hammers", expected: 1, seen: 2 }],
                verdict: "fail",
                faults: ["The sheet draws two hammers"],
              }
            : passSheetAnswerOf(),
      },
    });
    await makeForgeSheets(harness);
    await makeSheet({
      harness,
      castId: "hammer",
      kind: "prop",
      facts: ["Exactly one hammer"],
    });
    await setPlan({
      harness,
      shots: [{ shot_id: "strike", cast_ids: ["smith", "hammer"] }],
    });
    await passPlan(harness);

    const result = await shotCall({
      harness,
      assetId: "start",
      capability: "image",
      shotId: "strike",
    });

    expect(result.data).toMatchObject({ kind: "sheet-failed-review" });
    expect(result.data["message"]).toContain("The sheet draws two hammers");
  });

  it("needs a picture of the hands for a person who holds a prop in the plan", async () => {
    const harness = await startStoryHarness({ videoStyle: "ai-video" });
    await makeForgeSheets(harness);
    await makeSheet({
      harness,
      castId: "hammer",
      kind: "prop",
      facts: ["Exactly one hammer"],
    });
    const held = {
      cast_id: "hammer",
      held_by: { cast_id: "smith", hand: "right" as const },
    };
    await setPlan({
      harness,
      shots: [
        {
          shot_id: "strike",
          cast_ids: ["smith", "hammer"],
          start: [{ cast_id: "smith" }, held],
          end: [{ cast_id: "smith", state: "the blade is bent" }, held],
        },
      ],
    });
    await passPlan(harness);

    const result = await shotCall({
      harness,
      assetId: "start",
      capability: "image",
      shotId: "strike",
    });

    expect(result.data).toMatchObject({ kind: "cast-sheet-missing" });
    expect(result.data["message"]).toContain(
      '"smith" has no picture of the hands holding hammer',
    );
  });
});
