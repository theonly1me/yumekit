import { describe, expect, it } from "vitest";
import { putEntry, reviewedStart } from "../testing/firstCutFixture.js";
import type { Harness } from "../testing/harnessFixture.js";
import { planAnswerWith } from "../testing/planCritic.js";
import {
  makeForgeSheets,
  passPlan,
  setPlan,
  shotCall,
  startStoryHarness,
} from "../testing/storyFixture.js";

const strikeFault = "The hammer hand is two hands on one prop, close up";

async function filmWhosePlanFails(briefFaults?: Record<string, string>[]) {
  const harness = await startStoryHarness({
    videoStyle: "ai-video",
    critic: {
      plan: (brief) =>
        planAnswerWith({
          brief,
          verdict: "fail",
          shotFaults: { strike: [strikeFault] },
          ...(briefFaults === undefined ? {} : { briefFaults }),
        }),
    },
  });
  await makeForgeSheets(harness);
  await putEntry({
    harness,
    castId: "smith",
    extra: {
      reference_asset_ids: ["smith-sheet"],
      facts: ["The hammer is in her right hand"],
      brief_facts: ["Her hair is white"],
    },
  });
  await harness.call({ name: "review_sheet", arguments: { cast_id: "smith" } });
  await setPlan({
    harness,
    shots: [{ shot_id: "strike" }, { shot_id: "quench" }],
  });
  return harness;
}

function startOf(harness: Harness) {
  return shotCall({
    harness,
    assetId: "strike-start",
    capability: "image",
    shotId: "strike",
  });
}

describe("the plan check as advice", () => {
  it("makes a start picture with no plan check, and after a failed check, with each fault as a note on its shot", async () => {
    const harness = await filmWhosePlanFails();

    const before = await startOf(harness);
    const failed = await passPlan(harness);
    const after = await shotCall({
      harness,
      assetId: "quench-start",
      capability: "image",
      shotId: "quench",
    });

    const plan = harness.store.read().bible.storyPlan;
    expect(before.isError).toBe(false);
    expect(failed.data).toMatchObject({
      verdict: "fail",
      shots_with_open_plan_faults: ["strike"],
    });
    expect(failed.text).toContain("nothing waits for it");
    expect(after.isError).toBe(false);
    expect(plan?.shots[0]?.planNotes).toEqual([strikeFault]);
    expect(plan?.shots[1]?.planNotes).toBeUndefined();
  });

  it("runs a third plan check with no limit", async () => {
    const harness = await filmWhosePlanFails();
    await passPlan(harness);
    await passPlan(harness);

    const third = await passPlan(harness);

    expect(third.data).toMatchObject({ failed_plan_checks: 3 });
  });

  it("gives the critic of the start picture the faults that the plan check left open", async () => {
    const harness = await filmWhosePlanFails();
    await passPlan(harness);

    await reviewedStart({ harness, assetId: "strike-start", shotId: "strike" });

    const brief = harness.criticLog.briefs.at(-1) ?? "";
    expect(brief).toContain("Faults that the plan check left open.");
    expect(brief).toContain(`- Shot "strike": ${strikeFault}`);
  });

  it("blocks a shot that breaks a fact of the brief, until its exact text is restored", async () => {
    const harness = await filmWhosePlanFails([
      {
        cast_id: "smith",
        brief_fact: "Her hair is white",
        restore: "Her hair is white, tied back",
        seen: "The facts never say her hair is white.",
      },
    ]);
    await passPlan(harness);

    const blocked = await startOf(harness);
    await putEntry({
      harness,
      castId: "smith",
      extra: {
        reference_asset_ids: ["smith-sheet"],
        facts: [
          "The hammer is in her right hand",
          "Her hair is white, tied back",
        ],
      },
    });
    const restored = await startOf(harness);

    expect(blocked.data).toMatchObject({ kind: "plan-breaks-brief" });
    expect(blocked.data["message"]).toContain('"Her hair is white"');
    expect(blocked.data["hint"]).toContain(
      'Put this exact text in the facts of "smith" (put_cast_member): "Her hair is white, tied back".',
    );
    expect(restored.data["kind"]).not.toBe("plan-breaks-brief");
  });
});
