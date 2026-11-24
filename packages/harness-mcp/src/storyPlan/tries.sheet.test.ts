import { describe, expect, it } from "vitest";
import { passSheetAnswerOf } from "../testing/criticFixture.js";
import { plannedFilm, sheetTry, useSheet } from "../testing/firstCutFixture.js";
import type { Harness } from "../testing/harnessFixture.js";
import { passPlan, shotCall } from "../testing/storyFixture.js";

const failingSheets = {
  sheet: () => ({
    ...passSheetAnswerOf(),
    verdict: "fail",
    faults: ["The fingers of the left hand merge"],
  }),
};

async function refusedTry(options: {
  harness: Harness;
  assetId: string;
  extra?: Record<string, unknown>;
}) {
  const made = await sheetTry({
    harness: options.harness,
    castId: "smith",
    assetId: options.assetId,
    prompt: "Keep everything of the reference and change only the hand",
    ...(options.extra === undefined ? {} : { extra: options.extra }),
  });
  await useSheet({
    harness: options.harness,
    castId: "smith",
    assetIds: [options.assetId],
  });
  return made;
}

describe("the tries of a sheet", () => {
  it("starts the second try from the refused picture, asks for a simpler form after two, and stops after three", async () => {
    const harness = await plannedFilm({ critic: failingSheets });
    await sheetTry({ harness, castId: "smith", assetId: "smith-1" });
    await useSheet({ harness, castId: "smith", assetIds: ["smith-1"] });

    const fromNothing = await sheetTry({
      harness,
      castId: "smith",
      assetId: "smith-2",
      prompt: "A new smith",
    });
    await refusedTry({
      harness,
      assetId: "smith-2",
      extra: { reference_asset_ids: ["smith-1"] },
    });
    const third = await sheetTry({
      harness,
      castId: "smith",
      assetId: "smith-3",
      prompt: "The smith",
    });
    await refusedTry({
      harness,
      assetId: "smith-3",
      extra: {
        simpler_form: "One hand from one side, the other out of the frame",
      },
    });
    const fourth = await sheetTry({
      harness,
      castId: "smith",
      assetId: "smith-4",
      prompt: "The smith",
    });
    const asked = await sheetTry({
      harness,
      castId: "smith",
      assetId: "smith-4",
      prompt: "The smith",
      extra: { person_asked_for_another_try: true },
    });

    expect(fromNothing.data).toMatchObject({ kind: "start-from-refused" });
    expect(third.data).toMatchObject({ kind: "simplify-first" });
    expect(third.data["hint"]).toContain("two-hands-on-a-prop");
    expect(fourth.data).toMatchObject({ kind: "tries-used-up" });
    expect(asked.isError).toBe(false);
  });

  it("waits for the review of a try before the next one, and counts a picture made without sheet_of", async () => {
    const harness = await plannedFilm({ critic: failingSheets });
    await sheetTry({ harness, castId: "smith", assetId: "smith-1" });

    const unreviewed = await sheetTry({
      harness,
      castId: "smith",
      assetId: "smith-2",
      prompt: "Another smith",
    });
    await useSheet({ harness, castId: "smith", assetIds: ["smith-1"] });
    await harness.call({
      name: "generate_asset",
      arguments: {
        asset_id: "loose",
        capability: "image",
        input: { prompt: "A smith", width_pixels: 32, height_pixels: 18 },
      },
    });
    const dodged = await harness.call({
      name: "put_cast_member",
      arguments: {
        cast_id: "smith",
        kind: "person",
        name: "SMITH",
        description: "The smith",
        reference_asset_ids: ["loose"],
      },
    });

    expect(unreviewed.data).toMatchObject({ kind: "review-first" });
    expect(dodged.data).toMatchObject({ kind: "sheet-try-not-counted" });
    expect(
      harness.store.read().bible.cast.find((member) => member.id === "smith")
        ?.referenceAssetIds,
    ).toEqual(["smith-1"]);
  });

  it("uses a failed sheet with a recorded restriction after the plan check sees the restriction", async () => {
    const harness = await plannedFilm({ critic: failingSheets });
    await sheetTry({ harness, castId: "forge", assetId: "forge-1" });
    await useSheet({ harness, castId: "forge", assetIds: ["forge-1"] });
    await sheetTry({ harness, castId: "smith", assetId: "smith-1" });
    await useSheet({ harness, castId: "smith", assetIds: ["smith-1"] });
    const failed = await shotCall({
      harness,
      assetId: "start",
      capability: "image",
      shotId: "strike",
    });

    for (const castId of ["forge", "smith"]) {
      await harness.call({
        name: "put_cast_member",
        arguments: {
          cast_id: castId,
          kind: castId === "forge" ? "place" : "person",
          name: castId.toUpperCase(),
          description: `The ${castId}`,
          restrictions: ["Never show both hands close up"],
        },
      });
    }
    const stale = await shotCall({
      harness,
      assetId: "start",
      capability: "image",
      shotId: "strike",
    });
    await passPlan(harness);
    const restricted = await shotCall({
      harness,
      assetId: "start",
      capability: "image",
      shotId: "strike",
    });

    expect(failed.data).toMatchObject({ kind: "sheet-failed-review" });
    expect(stale.data).toMatchObject({ kind: "plan-not-reviewed" });
    expect(harness.criticLog.briefs.at(-1)).toContain(
      "Restrictions: Never show both hands close up",
    );
    expect(restricted.isError).toBe(false);
  });
});
