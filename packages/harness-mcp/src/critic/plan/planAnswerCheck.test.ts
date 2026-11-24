import { describe, expect, it } from "vitest";
import type { CriticAnswer } from "../../testing/criticFixture.js";
import { putEntry } from "../../testing/firstCutFixture.js";
import { planAnswerWith } from "../../testing/planCritic.js";
import {
  passPlan,
  setPlan,
  startStoryHarness,
} from "../../testing/storyFixture.js";

async function checkedPlan(answerOf: (brief: string) => CriticAnswer) {
  const harness = await startStoryHarness({
    videoStyle: "ai-video",
    critic: { plan: answerOf },
  });
  await putEntry({ harness, castId: "forge" });
  await putEntry({
    harness,
    castId: "smith",
    extra: { brief_facts: ["Her hair is white"] },
  });
  await setPlan({
    harness,
    shots: [{ shot_id: "strike" }, { shot_id: "quench" }],
  });
  const review = await passPlan(harness);
  return { harness, review };
}

describe("the answer of the plan check", () => {
  it("refuses more than 3 blocking faults for one shot", async () => {
    const { harness, review } = await checkedPlan((brief) =>
      planAnswerWith({
        brief,
        verdict: "fail",
        shotFaults: { strike: ["One", "Two", "Three", "Four"] },
      }),
    );

    expect(review.data).toMatchObject({ kind: "critic-failed" });
    expect(harness.criticLog.answers.at(-1)?.text).toContain(
      'Shot "strike" has 4 blocking faults. Keep at most 3',
    );
  });

  it("refuses a brief fault whose fact is not in the brief of the entry", async () => {
    const { harness } = await checkedPlan((brief) =>
      planAnswerWith({
        brief,
        verdict: "fail",
        briefFaults: [
          {
            cast_id: "smith",
            brief_fact: "Her hair is black",
            restore: "Her hair is black",
            seen: "The facts drop it.",
          },
        ],
      }),
    );

    expect(harness.criticLog.answers.at(-1)?.text).toContain(
      '"Her hair is black" is not a fact of the brief of "smith".',
    );
  });

  it("keeps a fault of one shot once when the critic also writes it as a fault of the whole plan", async () => {
    const shotFault =
      "The landing place contradicts itself: the middle of the frame, then screen left.";
    const { review } = await checkedPlan((brief) => ({
      ...planAnswerWith({
        brief,
        verdict: "fail",
        shotFaults: { strike: [shotFault, shotFault] },
      }),
      faults: [
        "Shot 1 'strike': the landing place is the middle of the frame in the prompt but screen left in the end entry.",
        'Shot "strike": The landing place contradicts itself.',
      ],
    }));

    expect(review.data["faults"]).toEqual([`Shot "strike": ${shotFault}`]);
  });

  it("refuses a fault of the whole plan that belongs to a shot with no fault of its own", async () => {
    const { harness } = await checkedPlan((brief) => ({
      ...planAnswerWith({ brief, verdict: "fail" }),
      faults: ["Shot 2 'quench': the steam hides the blade."],
    }));

    expect(harness.criticLog.answers.at(-1)?.text).toContain(
      'A fault of the whole plan names shot "quench": put it in the entry of that shot, once.',
    );
  });
});
