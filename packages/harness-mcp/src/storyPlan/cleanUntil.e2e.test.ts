import { describe, expect, it } from "vitest";
import { keepAnswerOf, passSheetAnswerOf } from "../testing/criticFixture.js";
import {
  designAnswersOf,
  reviewedStart,
  startDesignStory,
} from "../testing/designFixture.js";
import type { Harness } from "../testing/harnessFixture.js";

async function reviewedClip(breakFrom: number): Promise<Harness> {
  const harness = await startDesignStory({
    start: (brief) => ({
      ...passSheetAnswerOf(),
      design: designAnswersOf({ brief }),
    }),
    clip: (brief) => ({
      ...keepAnswerOf(brief),
      design: designAnswersOf({
        brief,
        designBreak: { question: 2, fromSeconds: breakFrom },
      }),
    }),
  });
  await reviewedStart({ harness });
  await harness.call({
    name: "generate_asset",
    arguments: {
      asset_id: "strike-clip",
      capability: "video",
      shot_id: "strike",
      first_frame_asset_id: "strike-start",
      input: { duration_seconds: 4 },
    },
  });
  await harness.call({
    name: "review_clip",
    arguments: { asset_id: "strike-clip", shot_id: "strike" },
  });
  return harness;
}

function clipCheckOf(harness: Harness) {
  return harness.store
    .read()
    .bible.storyPlan?.shots[0]?.designChecks?.find(
      (check) => check.assetId === "strike-clip",
    );
}

function place(options: {
  harness: Harness;
  durationFrames?: number;
  words?: string;
}) {
  return options.harness.call({
    name: "place_video",
    arguments: {
      output_id: "wide",
      asset_id: "strike-clip",
      start_frame: 0,
      ...(options.durationFrames === undefined
        ? {}
        : { duration_frames: options.durationFrames }),
      ...(options.words === undefined
        ? {}
        : { person_chose_this_clip: options.words }),
    },
  });
}

describe("a clip whose design breaks partway", () => {
  it("gets clean_until_seconds, and place_video shows only the part up to it", async () => {
    const harness = await reviewedClip(2);

    const check = clipCheckOf(harness);
    const whole = await place({ harness });
    const tooLong = await place({ harness, durationFrames: 60 });
    const clean = await place({ harness, durationFrames: 52 });

    expect(check).toMatchObject({
      assetId: "strike-clip",
      cleanUntilSeconds: 1.75,
      breaks: [
        expect.stringContaining("SMITH at 2s: A long leather apron"),
        expect.stringContaining("SMITH at 3.88s: A long leather apron"),
      ],
    });
    expect(whole.data).toMatchObject({ kind: "design-break-in-range" });
    expect(whole.text).toContain("at most 52");
    expect(tooLong.data).toMatchObject({ kind: "design-break-in-range" });
    expect(clean.isError).toBe(false);
  });

  it("cannot place a clean part under 1.2 seconds unless the person chooses the clip", async () => {
    const harness = await reviewedClip(1);

    const refused = await place({ harness, durationFrames: 20 });
    const words = "Keep the whole strike clip.";
    const chosen = await place({ harness, words });
    const check = clipCheckOf(harness);

    expect(refused.data).toMatchObject({ kind: "design-break-in-range" });
    expect(refused.text).toContain("under 1.2 seconds");
    expect(chosen.isError).toBe(false);
    expect(check).toMatchObject({
      cleanUntilSeconds: 0.75,
      personKept: { words },
    });
  });
});
