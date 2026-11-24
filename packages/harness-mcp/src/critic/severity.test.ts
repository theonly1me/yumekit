import { describe, expect, it } from "vitest";
import { keepAnswerOf, passSheetAnswerOf } from "../testing/criticFixture.js";
import { plannedFilm, sheetTry, useSheet } from "../testing/firstCutFixture.js";
import { shotCall } from "../testing/storyFixture.js";

const withNotes = {
  sheet: () => ({
    ...passSheetAnswerOf(),
    notes: ["The grip cord reads beige, not off-white"],
  }),
  clip: (brief: string) => ({
    ...keepAnswerOf(brief),
    notes: ["0.5s: the sash is a shade darker"],
  }),
};

describe("blocking faults and notes", () => {
  it("passes a sheet and keeps a clip that have only notes, and stores the notes", async () => {
    const harness = await plannedFilm({ critic: withNotes });
    for (const castId of ["forge", "smith"] as const) {
      await sheetTry({ harness, castId, assetId: `${castId}-1` });
      await useSheet({ harness, castId, assetIds: [`${castId}-1`] });
    }

    await shotCall({
      harness,
      assetId: "clip",
      capability: "video",
      shotId: "strike",
    });
    const kept = await harness.call({
      name: "review_clip",
      arguments: { asset_id: "clip", shot_id: "strike" },
    });
    const placed = await harness.call({
      name: "place_video",
      arguments: { output_id: "wide", asset_id: "clip", start_frame: 0 },
    });
    const smith = harness.store
      .read()
      .bible.cast.find((member) => member.id === "smith");

    expect(smith?.sheetReview).toMatchObject({
      verdict: "pass",
      notes: ["The grip cord reads beige, not off-white"],
    });
    expect(kept.data).toMatchObject({
      verdict: "keep",
      notes: ["0.5s: the sash is a shade darker"],
    });
    expect(placed.isError).toBe(false);
  });

  it("refuses a pass with a blocking fault, and gives the critic items for anatomy and likeness", async () => {
    const harness = await plannedFilm({
      critic: {
        sheet: () => ({
          ...passSheetAnswerOf(),
          faults: ["The arms cross through each other"],
        }),
      },
    });
    await sheetTry({ harness, castId: "smith", assetId: "smith-1" });

    const review = await useSheet({
      harness,
      castId: "smith",
      assetIds: ["smith-1"],
    });
    const brief = harness.criticLog.briefs.at(-1) ?? "";

    expect(brief).toContain(
      "4. Anatomy: count the arms, legs, hands, and fingers",
    );
    expect(brief).toContain(
      "6. Likeness: does the design look like a known character, uniform, or costume of an existing work?",
    );
    expect(harness.criticLog.answers.at(-1)?.text).toContain(
      "A pass has no blocking faults.",
    );
    expect(review.data).toMatchObject({ kind: "critic-failed" });
  });
});
