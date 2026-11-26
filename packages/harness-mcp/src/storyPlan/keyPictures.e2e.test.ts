import { describe, expect, it } from "vitest";
import { passSheetAnswerOf } from "../testing/criticFixture.js";
import {
  designAnswersOf,
  reviewedStart,
  startDesignStory,
} from "../testing/designFixture.js";
import { shotCall } from "../testing/storyFixture.js";

function clipCall(options: {
  harness: Awaited<ReturnType<typeof startDesignStory>>;
  extra?: Record<string, unknown>;
}) {
  return shotCall({
    harness: options.harness,
    assetId: "strike-clip",
    capability: "video",
    shotId: "strike",
    firstFrameAssetId: "strike-start",
    ...(options.extra === undefined ? {} : { extra: options.extra }),
  });
}

describe("the key pictures of a shot", () => {
  it("a clip with a start and an end picture that the critic checked together reaches the video model with both frames", async () => {
    const harness = await startDesignStory({
      start: (brief) => ({
        ...passSheetAnswerOf(),
        design: designAnswersOf({ brief }),
      }),
    });
    const reviewed = await reviewedStart({ harness, endPicture: true });

    const clip = await clipCall({
      harness,
      extra: { last_frame_asset_id: "strike-end" },
    });
    const sent = harness.runRequests.at(-1);
    const [startReview] =
      harness.store.read().bible.storyPlan?.shots[0]?.startReviews ?? [];

    expect(reviewed.isError).toBe(false);
    expect(harness.criticLog.briefs.at(-1)).toContain(
      'The end picture "strike-end" becomes the exact last frame',
    );
    expect(startReview).toMatchObject({
      assetId: "strike-start",
      endPictureAssetId: "strike-end",
    });
    expect(clip.isError).toBe(false);
    expect(JSON.stringify(sent?.input["first_frame_path"])).toContain(
      "strike-start",
    );
    expect(JSON.stringify(sent?.input["last_frame_path"])).toContain(
      "strike-end",
    );
  });

  it("an end picture with no design check cannot end a clip", async () => {
    const harness = await startDesignStory({
      start: (brief) => ({
        ...passSheetAnswerOf(),
        design: designAnswersOf({ brief }),
      }),
    });
    await shotCall({
      harness,
      assetId: "strike-end",
      capability: "image",
      shotId: "strike",
      prompt: "The blade is bent",
      extra: { key_picture: "end" },
    });
    await reviewedStart({ harness });

    const clip = await clipCall({
      harness,
      extra: { last_frame_asset_id: "strike-end" },
    });

    expect(clip.data).toMatchObject({ kind: "design-not-checked" });
    expect(clip.data["message"]).toContain(`"strike-end"`);
    expect(harness.runRequests.at(-1)?.capability).toBe("image");
  });

  it("the design check asks for each base fact, each garment, and each prop with its count and side, on the key picture", async () => {
    const harness = await startDesignStory({
      start: (brief) => ({
        ...passSheetAnswerOf(),
        design: designAnswersOf({ brief }),
      }),
    });

    await reviewedStart({ harness });
    const brief = harness.criticLog.briefs.at(-1) ?? "";

    expect(brief).toContain(
      'Design person "smith" look "default" with 3 questions; turnaround "smith-sheet".',
    );
    expect(brief).toContain("  1. Person: The hammer is in her right hand");
    expect(brief).toContain(
      "  2. Garment: A long leather apron over a sleeveless grey tunic",
    );
    expect(brief).toContain("  3. Prop: Exactly 1 hammer, in her right hand");
    expect(brief).toContain('Design frames: picture "strike-start"');
    expect(brief).toContain(
      "3. The sheets: each place and prop against its facts and its sheet pictures. Each person with a look is judged in the design check below",
    );
  });

  it("a no on a start picture marks a break and blocks its clip, and the words of the person open it", async () => {
    const harness = await startDesignStory({
      start: (brief) => ({
        ...passSheetAnswerOf(),
        design: designAnswersOf({
          brief,
          designBreak: { question: 2, assetId: "strike-start" },
        }),
      }),
    });
    const reviewed = await reviewedStart({ harness });

    const blocked = await clipCall({ harness });
    const words = "Use this start picture anyway, I like the sleeves.";
    const chosen = await clipCall({
      harness,
      extra: { person_chose_this_picture: words },
    });
    const [check] =
      harness.store.read().bible.storyPlan?.shots[0]?.designChecks ?? [];

    expect(reviewed.data).toMatchObject({
      verdict: "pass",
      design_breaks: [
        expect.stringContaining(
          "A long leather apron over a sleeveless grey tunic",
        ),
      ],
    });
    expect(blocked.data).toMatchObject({ kind: "design-break" });
    expect(chosen.isError).toBe(false);
    expect(check).toMatchObject({
      assetId: "strike-start",
      by: "critic",
      personKept: { words },
    });
  });
});
