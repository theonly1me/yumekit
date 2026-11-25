import { mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { passSheetAnswerOf } from "../../testing/criticFixture.js";
import {
  designAnswersOf,
  reviewedStart,
  startDesignStory,
} from "../../testing/designFixture.js";
import type { Harness, ToolCall } from "../../testing/harnessFixture.js";
import { probeVideo } from "../../testing/probeVideo.js";
import { shotCall } from "../../testing/storyFixture.js";

const passWithDesign = {
  start: (brief: string) => ({
    ...passSheetAnswerOf(),
    design: designAnswersOf({ brief }),
  }),
};

async function pictureHeightsOf(view: ToolCall): Promise<number[]> {
  const folder = await mkdtemp(join(tmpdir(), "design-crop-"));
  const images = view.result.content.flatMap((content) =>
    content.type === "image" ? [content.data] : [],
  );
  return Promise.all(
    images.map(async (...[data, index]) => {
      const file = join(folder, `${String(index)}.jpg`);
      await writeFile(file, Buffer.from(data, "base64"));
      const [stream] = await probeVideo(file);
      return stream?.height ?? 0;
    }),
  );
}

async function startPicture(harness: Harness) {
  await shotCall({
    harness,
    assetId: "strike-start",
    capability: "image",
    shotId: "strike",
  });
  return harness.store
    .read()
    .assets.find((asset) => asset.id === "strike-start");
}

describe("the crops of the design check", () => {
  it("shows the person enlarged, next to the turnaround of the look, in one picture", async () => {
    const harness = await startDesignStory(passWithDesign);
    const picture = await startPicture(harness);
    const region = { x: 0, y: 0, width: 0.25, height: 0.5 };

    const view = await harness.call({
      name: "check_design",
      arguments: {
        asset_id: "strike-start",
        shot_id: "strike",
        cast_id: "smith",
        region,
      },
    });
    const heights = await pictureHeightsOf(view);
    const nativeCropHeight = (picture?.heightPixels ?? 0) * region.height;

    expect(view.isError).toBe(false);
    expect(heights).toHaveLength(1);
    expect(heights[0] ?? 0).toBeGreaterThan(10 * nativeCropHeight);
    expect(view.text).toContain('SMITH in "strike-start", enlarged');
    expect(view.text).toContain("The questions for SMITH: 1.");
  });

  it("refuses an answer of the critic for a frame whose crop it did not look at", async () => {
    const harness = await startDesignStory({
      ...passWithDesign,
      skipDesignLooks: true,
    });

    const reviewed = await reviewedStart({ harness });

    expect(harness.criticLog.answers.at(-1)?.isError).toBe(true);
    expect(harness.criticLog.answers.at(-1)?.text).toContain(
      'You answered "smith" at asset_id "strike-start" without its enlarged crop',
    );
    expect(reviewed.isError).toBe(true);
  });

  it("stores the check of the lead only after it looked at each crop", async () => {
    const harness = await startDesignStory(passWithDesign);
    await startPicture(harness);
    const shot = { asset_id: "strike-start", shot_id: "strike" };
    const brief = await harness.call({ name: "check_design", arguments: shot });
    const design = designAnswersOf({ brief: brief.text });

    const unseen = await harness.call({
      name: "check_design",
      arguments: { ...shot, design },
    });
    await harness.call({
      name: "check_design",
      arguments: { ...shot, cast_id: "smith" },
    });
    const stored = await harness.call({
      name: "check_design",
      arguments: { ...shot, design },
    });
    const [check] =
      harness.store.read().bible.storyPlan?.shots[0]?.designChecks ?? [];

    expect(unseen.isError).toBe(true);
    expect(unseen.text).toContain("without its enlarged crop");
    expect(stored.isError).toBe(false);
    expect(check).toMatchObject({ assetId: "strike-start", by: "lead" });
  });
});
