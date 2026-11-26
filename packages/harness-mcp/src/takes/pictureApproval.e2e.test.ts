import { describe, expect, it } from "vitest";
import {
  checkedByLead,
  dressDraftStory,
} from "../testing/leadDesignFixture.js";
import { shotCall } from "../testing/storyFixture.js";
import {
  clip,
  picture,
  readyPictures,
  startTakeHarness,
  type TakeHarness,
} from "../testing/takeHarness.js";

function makeClip(harness: TakeHarness) {
  return harness.call({
    name: "generate_asset",
    arguments: clip({ assetId: "drift", from: "still" }),
  });
}

async function startShotStory(): Promise<TakeHarness> {
  const harness = await startTakeHarness({ videoStyle: "ai-video" });
  await dressDraftStory({ harness, shotIds: ["strike"] });
  return harness;
}

function strikeClip(harness: TakeHarness) {
  return shotCall({
    harness,
    assetId: "strike-clip",
    capability: "video",
    shotId: "strike",
    firstFrameAssetId: "strike-start",
  });
}

async function readyStrikeStart(harness: TakeHarness): Promise<void> {
  await harness.call({ name: "open_take", arguments: { step: "pictures" } });
  await shotCall({
    harness,
    assetId: "strike-start",
    capability: "image",
    shotId: "strike",
  });
}

describe("approve pictures before clips", { timeout: 120_000 }, () => {
  it("refuses a clip of a picture that the person has not approved, and false lets it go", async () => {
    const harness = await startTakeHarness();
    await harness.call({ name: "generate_asset", arguments: picture("still") });

    const refused = await makeClip(harness);
    await harness.call({
      name: "set_approve_pictures_first",
      arguments: { approve_pictures_first: false },
    });
    const made = await makeClip(harness);

    expect(refused.data).toMatchObject({ kind: "picture-not-approved" });
    expect(refused.data["message"]).toContain('approved "still"');
    expect(made.isError).toBe(false);
  });

  it("starts a clip from a picture that the person approved, and not from one with a note", async () => {
    const harness = await startTakeHarness();
    await readyPictures({ harness, assetIds: ["still"] });
    await harness.sendTake({
      takeId: "take-1",
      notes: [{ item_id: "still", text: "Less fog." }],
    });
    const noted = await makeClip(harness);
    await harness.call({ name: "open_take", arguments: { step: "pictures" } });
    await harness.call({
      name: "ready_take",
      arguments: { items: [{ id: "still", note: "The same picture again." }] },
    });

    await harness.sendTake({ takeId: "take-2", notes: [] });
    const approved = await makeClip(harness);

    expect(noted.data).toMatchObject({ kind: "picture-not-approved" });
    expect(noted.data["hint"]).toContain(
      'The person asked for a change of "still"',
    );
    expect(approved.isError).toBe(false);
  });

  it("an approved start picture opens the design gate as the person's word", async () => {
    const harness = await startShotStory();
    await harness.call({
      name: "set_approve_pictures_first",
      arguments: { approve_pictures_first: false },
    });
    await readyStrikeStart(harness);
    const unchecked = await strikeClip(harness);
    await harness.call({
      name: "ready_take",
      arguments: { items: [{ id: "strike-start", note: "She strikes." }] },
    });

    await harness.sendTake({ takeId: "take-1", notes: [] });
    const made = await strikeClip(harness);

    expect(unchecked.data).toMatchObject({ kind: "design-not-checked" });
    expect(made.isError).toBe(false);
    const shot = harness.store.read().bible.storyPlan?.shots[0];
    expect(shot?.designChecks).toContainEqual({
      assetId: "strike-start",
      by: "person",
      frames: [],
      breaks: [],
      personKept: { words: "Approved in take 1" },
    });
  });

  it("the next batch waits for the person after the lead's check", async () => {
    const harness = await startShotStory();
    await readyStrikeStart(harness);
    await checkedByLead({
      harness,
      targets: [{ asset_id: "strike-start", shot_id: "strike" }],
    });

    const work = await harness.call({ name: "get_work", arguments: {} });

    expect(work.text).toContain(
      'Waiting: "strike" waits for the person to approve its start picture "strike-start" in a take.',
    );
  });
});
