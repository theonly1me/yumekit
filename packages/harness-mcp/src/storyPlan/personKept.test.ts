import { filmMeasureOf } from "@yumekit/project";
import { describe, expect, it } from "vitest";
import { keepAnswerOf } from "../testing/criticFixture.js";
import type { Harness } from "../testing/harnessFixture.js";
import {
  makeForgeSheets,
  passPlan,
  setPlan,
  shotCall,
  startStoryHarness,
} from "../testing/storyFixture.js";

const hammerFault = "A second hammer appears in her left hand at 0.4 seconds";
const personWords = "Keep the strike clip, I like it.";

async function refusedClip(): Promise<Harness> {
  const harness = await startStoryHarness({
    videoStyle: "ai-video",
    critic: {
      clip: (brief) => ({
        ...keepAnswerOf(brief),
        verdict: "redo",
        faults: [hammerFault],
      }),
    },
  });
  await makeForgeSheets(harness);
  await setPlan({ harness, shots: [{ shot_id: "strike" }] });
  await passPlan(harness);
  await shotCall({
    harness,
    assetId: "strike-clip",
    capability: "video",
    shotId: "strike",
  });
  await harness.call({
    name: "review_clip",
    arguments: { asset_id: "strike-clip", shot_id: "strike" },
  });
  return harness;
}

function place(options: { harness: Harness; words?: string }) {
  return options.harness.call({
    name: "place_video",
    arguments: {
      output_id: "wide",
      asset_id: "strike-clip",
      start_frame: 0,
      ...(options.words === undefined
        ? {}
        : { person_chose_this_clip: options.words }),
    },
  });
}

describe("a clip that the person keeps after the critic refused it", () => {
  it("is placed, and the choice of the person is stored next to the faults of the critic", async () => {
    const harness = await refusedClip();

    const refused = await place({ harness });
    const placed = await place({ harness, words: personWords });
    const snapshot = harness.store.read();
    const [review] = snapshot.bible.storyPlan?.shots[0]?.reviews ?? [];

    expect(refused.data).toMatchObject({ kind: "clip-failed-review" });
    expect(placed.isError).toBe(false);
    expect(review).toMatchObject({
      verdict: "redo",
      by: "critic",
      faults: [expect.stringContaining("second hammer")],
      personKept: { words: personWords },
    });
    expect(
      filmMeasureOf({
        shots: snapshot.bible.storyPlan?.shots ?? [],
        cast: [],
        assets: [],
      }).shots,
    ).toEqual([expect.objectContaining({ shotId: "strike", accepted: true })]);
  });

  it("is one undo step: undo removes the clip and the choice of the person", async () => {
    const harness = await refusedClip();

    await place({ harness, words: personWords });
    await harness.call({ name: "undo", arguments: {} });
    const [review] =
      harness.store.read().bible.storyPlan?.shots[0]?.reviews ?? [];

    expect(review?.personKept).toBeUndefined();
    expect((await place({ harness })).data).toMatchObject({
      kind: "clip-failed-review",
    });
  });
});
