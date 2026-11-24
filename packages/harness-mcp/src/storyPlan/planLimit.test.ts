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

describe("the limit of the plan check", () => {
  it("opens the gate after the second failed check and stores each open fault on its shot", async () => {
    const harness = await filmWhosePlanFails();

    await passPlan(harness);
    const afterOne = await startOf(harness);
    const second = await passPlan(harness);
    const afterTwo = await startOf(harness);

    const plan = harness.store.read().bible.storyPlan;
    expect(afterOne.data).toMatchObject({ kind: "plan-failed-review" });
    expect(second.data).toMatchObject({
      verdict: "fail",
      failed_plan_checks: 2,
      shots_with_open_plan_faults: ["strike"],
    });
    expect(second.text).toContain("These shots carry open plan faults");
    expect(afterTwo.isError).toBe(false);
    expect(plan?.shots[0]?.planNotes).toEqual([strikeFault]);
    expect(plan?.shots[1]?.planNotes).toBeUndefined();
  });

  it("refuses a third check unless the person asked for it", async () => {
    const harness = await filmWhosePlanFails();
    await passPlan(harness);
    await passPlan(harness);

    const third = await passPlan(harness);
    const asked = await harness.call({
      name: "review_plan",
      arguments: { person_asked_for_another_check: true },
    });

    expect(third.data).toMatchObject({ kind: "plan-checks-used-up" });
    expect(asked.data).toMatchObject({ failed_plan_checks: 3 });
    expect(
      harness.criticLog.briefs.filter((brief) =>
        brief.startsWith("Review job: the plan"),
      ),
    ).toHaveLength(3);
  });

  it("gives the critic of the start picture the faults that the plan check left open", async () => {
    const harness = await filmWhosePlanFails();
    await passPlan(harness);
    await passPlan(harness);

    await reviewedStart({ harness, assetId: "strike-start", shotId: "strike" });

    const brief = harness.criticLog.briefs.at(-1) ?? "";
    expect(brief).toContain("Faults that the plan check left open.");
    expect(brief).toContain(`- Shot "strike": ${strikeFault}`);
  });

  it("keeps a broken fact of the brief blocking after the gate opens, until its exact text is restored", async () => {
    const harness = await filmWhosePlanFails([
      {
        cast_id: "smith",
        brief_fact: "Her hair is white",
        restore: "Her hair is white, tied back",
        seen: "The facts never say her hair is white.",
      },
    ]);
    await passPlan(harness);
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
