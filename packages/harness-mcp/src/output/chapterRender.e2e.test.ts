import { access } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { dressDraftStory } from "../testing/leadDesignFixture.js";
import { setPlan, shotCall } from "../testing/storyFixture.js";
import { startTakeHarness, type TakeHarness } from "../testing/takeHarness.js";

async function placeShot(options: {
  harness: TakeHarness;
  shotId: string;
  startFrame: number;
}): Promise<void> {
  const { harness, shotId } = options;
  await shotCall({
    harness,
    assetId: `${shotId}-start`,
    capability: "image",
    shotId,
  });
  await shotCall({
    harness,
    assetId: `${shotId}-clip`,
    capability: "video",
    shotId,
    firstFrameAssetId: `${shotId}-start`,
  });
  await harness.call({
    name: "place_video",
    arguments: {
      output_id: "wide",
      asset_id: `${shotId}-clip`,
      start_frame: options.startFrame,
    },
  });
}

describe("render_video with a chapter", { timeout: 120_000 }, () => {
  it("renders only the time of the chapter, and the file is the cut of its take", async () => {
    const harness = await startTakeHarness({
      videoStyle: "ai-video",
      approvePicturesFirst: false,
    });
    await dressDraftStory({ harness, shotIds: ["a"] });
    await setPlan({
      harness,
      shots: ["a", "b"].map((shotId) => ({ shot_id: shotId, cast_ids: [] })),
      chapters: [
        { chapter_id: "dock", title: "The dock", shot_ids: ["a"] },
        { chapter_id: "sea", title: "The sea", shot_ids: ["b"] },
      ],
    });
    await placeShot({ harness, shotId: "a", startFrame: 0 });
    await placeShot({ harness, shotId: "b", startFrame: 30 });
    await harness.call({
      name: "open_take",
      arguments: { step: "cut", chapter_id: "sea" },
    });

    const rendered = await harness.call({
      name: "render_video",
      arguments: { output_id: "wide", chapter_id: "sea", scale: 0.25 },
    });

    expect(rendered.data).toMatchObject({
      chapter_id: "sea",
      first_frame: 30,
      frame_count: 30,
    });
    const file = "renders/chapters/sea-wide.mp4";
    await expect(access(join(harness.folder, file))).resolves.toBeUndefined();
    expect(harness.store.read().takes[0]?.items).toEqual([
      { kind: "cut", id: "cut", outputId: "wide", file },
    ]);
  });
});
