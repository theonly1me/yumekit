import { describe, expect, it } from "vitest";
import { dressDraftStory } from "../testing/leadDesignFixture.js";
import { shotCall } from "../testing/storyFixture.js";
import {
  clip,
  picture,
  readyPictures,
  startTakeHarness,
  type TakeHarness,
} from "../testing/takeHarness.js";

const words = { person_chose_this_picture: "Use this picture." };

function clipWithWords(harness: TakeHarness) {
  return harness.call({
    name: "generate_asset",
    arguments: { ...clip({ assetId: "drift", from: "still" }), ...words },
  });
}

async function startShotStory(): Promise<TakeHarness> {
  const harness = await startTakeHarness({
    videoStyle: "ai-video",
    approvePicturesFirst: false,
  });
  await dressDraftStory({ harness, shotIds: ["strike"] });
  return harness;
}

function strikeCall(options: {
  harness: TakeHarness;
  assetId: string;
  capability: "image" | "video";
}) {
  const isClip = options.capability === "video";
  return shotCall({
    ...options,
    shotId: "strike",
    ...(isClip ? { firstFrameAssetId: "strike-start", extra: words } : {}),
  });
}

async function readyOne(options: {
  harness: TakeHarness;
  step: "pictures" | "clips";
  assetId: string;
}): Promise<void> {
  const { harness, assetId } = options;
  await harness.call({ name: "open_take", arguments: { step: options.step } });
  await strikeCall({
    harness,
    assetId,
    capability: options.step === "clips" ? "video" : "image",
  });
  await harness.call({
    name: "ready_take",
    arguments: {
      items: [
        {
          id: assetId,
          note: "She strikes the blade.",
          what_to_check: "The hammer from 0.2 to 0.6 seconds.",
        },
      ],
    },
  });
}

describe(
  "a verdict of the person in a take wins over words in a call",
  { timeout: 120_000 },
  () => {
    it.each([
      {
        note: { text: "", dropped: true as const },
        says: 'The person dropped "still" in take 1.',
      },
      {
        note: { text: "Less fog." },
        says: 'The person asked for a change of "still" in take 1.',
      },
    ])(
      "refuses a clip of a picture with the verdict: $says",
      async ({ note, says }) => {
        const harness = await startTakeHarness();
        await readyPictures({ harness, assetIds: ["still"] });
        await harness.sendTake({
          takeId: "take-1",
          notes: [{ item_id: "still", ...note }],
        });

        const refused = await clipWithWords(harness);

        expect(refused.data).toMatchObject({ kind: "picture-not-approved" });
        expect(refused.data["message"]).toContain(says);
      },
    );

    it("accepts the words for a picture that no take judged", async () => {
      const harness = await startTakeHarness();
      await harness.call({
        name: "generate_asset",
        arguments: picture("still"),
      });

      const made = await clipWithWords(harness);

      expect(made.isError).toBe(false);
    });

    it("the words do not open the design gate of a start picture that the person dropped", async () => {
      const harness = await startShotStory();
      await readyOne({ harness, step: "pictures", assetId: "strike-start" });
      await harness.sendTake({
        takeId: "take-1",
        notes: [{ item_id: "strike-start", text: "", dropped: true }],
      });

      const refused = await strikeCall({
        harness,
        assetId: "strike-clip",
        capability: "video",
      });

      expect(refused.data).toMatchObject({ kind: "design-not-checked" });
      const shot = harness.store.read().bible.storyPlan?.shots[0];
      expect(shot?.designChecks ?? []).toEqual([]);
    });

    it("the words do not keep a clip that the person asked to change", async () => {
      const harness = await startShotStory();
      await strikeCall({
        harness,
        assetId: "strike-start",
        capability: "image",
      });
      await readyOne({ harness, step: "clips", assetId: "strike-clip" });
      await harness.sendTake({
        takeId: "take-1",
        notes: [
          { item_id: "strike-clip", text: "The hammer bends.", seconds: 0.4 },
        ],
      });

      const placed = await harness.call({
        name: "place_video",
        arguments: {
          output_id: "wide",
          asset_id: "strike-clip",
          start_frame: 0,
          person_chose_this_clip: "Keep this clip.",
        },
      });

      expect(placed.data).toMatchObject({ kind: "design-not-checked" });
    });
  },
);
