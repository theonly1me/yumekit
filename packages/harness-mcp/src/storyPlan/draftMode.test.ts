import { describe, expect, it } from "vitest";
import {
  checkedByLead,
  startDraftStory,
} from "../testing/leadDesignFixture.js";
import type { Harness } from "../testing/harnessFixture.js";

const shotIds = ["strike", "quench"];

function batchOf(options: { harness: Harness; capability: "image" | "video" }) {
  const { harness, capability } = options;
  return harness.call({
    name: "generate_assets",
    arguments: {
      calls: shotIds.map((shotId) => ({
        asset_id: `${shotId}-${capability === "image" ? "start" : "clip"}`,
        capability,
        shot_id: shotId,
        input:
          capability === "image"
            ? { width_pixels: 32, height_pixels: 18 }
            : { duration_seconds: 2 },
        ...(capability === "video"
          ? { first_frame_asset_id: `${shotId}-start` }
          : {}),
      })),
    },
  });
}

function targetsOf(kind: "start" | "clip") {
  return shotIds.map((shotId) => ({
    asset_id: `${shotId}-${kind}`,
    shot_id: shotId,
  }));
}

function placeStrike(options: { harness: Harness; words?: string }) {
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

describe("a film in draft mode", { timeout: 120_000 }, () => {
  it("runs the plan, the start pictures, the clips, and the placements with no critic call when the design checks of the lead pass", async () => {
    const harness = await startDraftStory(shotIds);

    const starts = await batchOf({ harness, capability: "image" });
    await checkedByLead({ harness, targets: targetsOf("start") });
    const clips = await batchOf({ harness, capability: "video" });
    await checkedByLead({ harness, targets: targetsOf("clip") });
    const placed = await placeStrike({ harness });

    expect(starts.isError).toBe(false);
    expect(clips.isError).toBe(false);
    expect(clips.text).not.toContain("design-not-checked");
    expect(placed.isError).toBe(false);
    expect(harness.criticLog.briefs).toEqual([]);
    expect(harness.store.read().project.checks).toBeUndefined();
  });

  it("stores one design check for each picture of a batch in one call", async () => {
    const harness = await startDraftStory(shotIds);
    await batchOf({ harness, capability: "image" });

    const stored = await checkedByLead({
      harness,
      targets: targetsOf("start"),
    });
    const checks = (harness.store.read().bible.storyPlan?.shots ?? []).map(
      (shot) => shot.designChecks,
    );

    expect(stored.text).toContain("2 design checks stored.");
    expect(checks).toEqual([
      [expect.objectContaining({ assetId: "strike-start", by: "lead" })],
      [expect.objectContaining({ assetId: "quench-start", by: "lead" })],
    ]);
  });

  it("refuses a clip from a start picture with no design check, and the words of the person open it", async () => {
    const harness = await startDraftStory(["strike"]);
    await harness.call({
      name: "generate_asset",
      arguments: {
        asset_id: "strike-start",
        capability: "image",
        shot_id: "strike",
        input: { width_pixels: 32, height_pixels: 18 },
      },
    });
    const clip = {
      asset_id: "strike-clip",
      capability: "video",
      shot_id: "strike",
      first_frame_asset_id: "strike-start",
      input: { duration_seconds: 2 },
    };

    const refused = await harness.call({
      name: "generate_asset",
      arguments: clip,
    });
    const words = "Use this start picture as it is.";
    const chosen = await harness.call({
      name: "generate_asset",
      arguments: { ...clip, person_chose_this_picture: words },
    });
    const check =
      harness.store.read().bible.storyPlan?.shots[0]?.designChecks?.[0];

    expect(refused.data).toMatchObject({ kind: "design-not-checked" });
    expect(refused.data["message"]).toContain('"strike-start"');
    expect(chosen.isError).toBe(false);
    expect(check).toMatchObject({
      assetId: "strike-start",
      by: "person",
      personKept: { words },
    });
  });

  it("refuses to place a clip with no design check, and the words of the person open it", async () => {
    const harness = await startDraftStory(shotIds);
    await batchOf({ harness, capability: "image" });
    await checkedByLead({ harness, targets: targetsOf("start") });
    await batchOf({ harness, capability: "video" });

    const refused = await placeStrike({ harness });
    const chosen = await placeStrike({
      harness,
      words: "Place the strike clip.",
    });

    expect(refused.data).toMatchObject({ kind: "design-not-checked" });
    expect(chosen.isError).toBe(false);
  });

  it("sends the prompt of the plan when the call gives none, and the prompt of the lead when it gives one", async () => {
    const harness = await startDraftStory(["strike"]);
    const call = {
      capability: "image",
      shot_id: "strike",
      input: { width_pixels: 32, height_pixels: 18 },
    };

    await harness.call({
      name: "generate_asset",
      arguments: { ...call, asset_id: "planned" },
    });
    const planned = harness.runRequests.at(-1)?.input["prompt"];
    await harness.call({
      name: "generate_asset",
      arguments: {
        ...call,
        asset_id: "own",
        input: { ...call.input, prompt: "The smith, closer" },
      },
    });
    const own = harness.runRequests.at(-1)?.input["prompt"];

    expect(planned).toBe("strike start");
    expect(own).toBe("The smith, closer");
  });
});
