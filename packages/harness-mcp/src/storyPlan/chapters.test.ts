import { describe, expect, it } from "vitest";
import { dressDraftStory } from "../testing/leadDesignFixture.js";
import { setPlan } from "../testing/storyFixture.js";
import { startTakeHarness } from "../testing/takeHarness.js";

function chapter(chapterAndShots: [string, ...string[]]) {
  const [chapterId, ...shotIds] = chapterAndShots;
  return {
    chapter_id: chapterId,
    title: `Chapter ${chapterId}`,
    shot_ids: shotIds,
  };
}

function shots(shotIds: string[]) {
  return shotIds.map((shotId) => ({ shot_id: shotId }));
}

async function startPlannedStory() {
  const harness = await startTakeHarness({ videoStyle: "ai-video" });
  await dressDraftStory({ harness, shotIds: ["a"] });
  return harness;
}

describe("chapters in set_story_plan", { timeout: 60_000 }, () => {
  it("keeps the chapters, and a new shot joins the chapter of the shot before it", async () => {
    const harness = await startPlannedStory();
    const split = await setPlan({
      harness,
      shots: shots(["a", "b", "c"]),
      chapters: [chapter(["one", "a"]), chapter(["two", "b", "c"])],
    });

    await setPlan({ harness, shots: shots(["a", "a2", "b", "c"]) });

    expect(split.data["chapters"]).toEqual([
      { chapter_id: "one", shot_ids: ["a"] },
      { chapter_id: "two", shot_ids: ["b", "c"] },
    ]);
    expect(
      harness.store
        .read()
        .bible.storyPlan?.chapters?.map((each) => [each.id, each.shotIds]),
    ).toEqual([
      ["one", ["a", "a2"]],
      ["two", ["b", "c"]],
    ]);
  });

  it.each([
    { kind: "chapter-misses-shot", chapters: [chapter(["one", "a", "b"])] },
    {
      kind: "shot-in-two-chapters",
      chapters: [chapter(["one", "a", "b"]), chapter(["two", "b", "c"])],
    },
    {
      kind: "chapters-break-order",
      chapters: [chapter(["one", "a", "c"]), chapter(["two", "b"])],
    },
  ])("refuses chapters with the failure $kind", async ({ kind, chapters }) => {
    const harness = await startPlannedStory();

    const refused = await setPlan({
      harness,
      shots: shots(["a", "b", "c"]),
      chapters,
    });

    expect(refused.data).toMatchObject({ kind });
    expect(harness.store.read().bible.storyPlan?.shots).toHaveLength(1);
  });
});
