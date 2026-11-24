import { describe, expect, it } from "vitest";
import { putEntry, sheetTry } from "../testing/firstCutFixture.js";
import { planAnswerWith } from "../testing/planCritic.js";
import {
  passPlan,
  setPlan,
  shotCall,
  startStoryHarness,
} from "../testing/storyFixture.js";

async function filmWithPlan(critic?: Parameters<typeof startStoryHarness>[0]) {
  const harness = await startStoryHarness({
    videoStyle: "ai-video",
    ...critic,
  });
  await putEntry({ harness, castId: "forge" });
  await putEntry({
    harness,
    castId: "smith",
    extra: { facts: ["Twice the width of her brother"] },
  });
  await setPlan({
    harness,
    shots: [{ shot_id: "strike" }, { shot_id: "quench" }],
  });
  return harness;
}

describe("review_plan before the first paid call", () => {
  it("makes no start picture or clip of a story film before the critic passes the plan", async () => {
    const harness = await filmWithPlan({
      critic: {
        plan: (brief) =>
          planAnswerWith({
            brief,
            verdict: "fail",
            shotFaults: {
              quench: ["The hand is two hands on one prop, close up"],
            },
          }),
      },
    });

    const startPicture = {
      harness,
      assetId: "strike-start",
      capability: "image",
      shotId: "strike",
    } as const;
    const before = await shotCall(startPicture);
    const review = await passPlan(harness);
    const after = await shotCall(startPicture);

    expect(before.data).toMatchObject({ kind: "plan-not-reviewed" });
    expect(review.data).toMatchObject({ verdict: "fail" });
    expect(after.data).toMatchObject({ kind: "plan-failed-review" });
    expect(after.data["message"]).toContain("two hands on one prop");
    expect(harness.runRequests).toHaveLength(0);
  });

  it("gives the critic each prompt, each fact, and each finding of the word test, and refuses a pass with a finding that is a fault", async () => {
    const harness = await filmWithPlan({
      critic: {
        plan: (brief) =>
          planAnswerWith({
            brief,
            findingCause: "fault",
          }),
      },
    });

    const review = await passPlan(harness);
    const brief = harness.criticLog.briefs.at(-1) ?? "";

    expect(brief).toContain('Start picture prompt: "strike start"');
    expect(brief).toContain('Video prompt: "quench clip"');
    expect(brief).toContain('Sheet prompt 1: "smith sheet"');
    expect(brief).toContain('"smith" gives a size as a number or a ratio');
    expect(brief).toContain('"smith" does not name a garment');
    expect(brief).toContain("small-contact-target");
    expect(harness.criticLog.answers.at(-1)?.text).toContain(
      "A pass has no blocking fault",
    );
    expect(review.data).toMatchObject({ kind: "critic-failed" });
  });

  it("sends the reviewed prompt on the first try, refuses another, and asks again after a change of the plan", async () => {
    const harness = await filmWithPlan();
    await passPlan(harness);

    const other = await sheetTry({
      harness,
      castId: "smith",
      assetId: "s1",
      prompt: "A smith, more muscular",
    });
    const reviewed = await sheetTry({
      harness,
      castId: "smith",
      assetId: "s1",
    });
    const sent = harness.runRequests.at(-1)?.input["prompt"] ?? "";
    await putEntry({
      harness,
      castId: "smith",
      extra: { facts: ["Side by side, her head reaches his chin"] },
    });
    const changed = await shotCall({
      harness,
      assetId: "strike-start",
      capability: "image",
      shotId: "strike",
    });

    expect(other.data).toMatchObject({ kind: "prompt-not-reviewed" });
    expect(reviewed.isError).toBe(false);
    expect(sent).toEqual(expect.stringMatching(/^smith sheet/));
    expect(changed.data).toMatchObject({ kind: "plan-not-reviewed" });
  });

  it("protects a fact of the person's brief from the lead", async () => {
    const harness = await filmWithPlan();
    await putEntry({
      harness,
      castId: "smith",
      extra: { brief_facts: ["A head and a half taller than her brother"] },
    });

    const dropped = await putEntry({
      harness,
      castId: "smith",
      extra: { brief_facts: [] },
    });
    const asked = await putEntry({
      harness,
      castId: "smith",
      extra: { brief_facts: [], person_asked_to_change_brief: true },
    });

    expect(dropped.data).toMatchObject({ kind: "brief-fact-protected" });
    expect(asked.isError).toBe(false);
  });
});
