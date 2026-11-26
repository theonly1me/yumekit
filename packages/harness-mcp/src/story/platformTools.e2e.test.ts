import { describe, expect, it } from "vitest";
import {
  harnessWithYoutubeAndTiktok,
  outputsOf,
  sceneIdsOf,
} from "../testing/platformFixture.js";

describe("add_platform", () => {
  it("adds Instagram Reel to the TikTok output with no new output, in one undo step", async () => {
    const harness = await harnessWithYoutubeAndTiktok();

    const added = await harness.call({
      name: "add_platform",
      arguments: { platform_id: "instagram-reel" },
    });

    expect(added.isError).toBe(false);
    expect(outputsOf(harness)).toEqual([
      { id: "wide", platforms: ["youtube"] },
      { id: "tall", platforms: ["tiktok", "instagram-reel"] },
    ]);
    await harness.call({ name: "undo" });
    expect(outputsOf(harness)).toEqual([
      { id: "wide", platforms: ["youtube"] },
      { id: "tall", platforms: ["tiktok"] },
    ]);
  });

  it("adds Square with a new output that has the scenes of the nearest shape, in one undo step", async () => {
    const harness = await harnessWithYoutubeAndTiktok();

    await harness.call({
      name: "add_platform",
      arguments: { platform_id: "square" },
    });

    const square = harness.store
      .read()
      .project.outputs.find((output) => output.id === "square");
    expect(square).toEqual({
      id: "square",
      label: "Square 1:1",
      widthPixels: 1080,
      heightPixels: 1080,
      platforms: ["square"],
    });
    expect(sceneIdsOf({ harness, outputId: "square" })).toEqual(["tall-title"]);
    await harness.call({ name: "undo" });
    expect(outputsOf(harness).map((output) => output.id)).toEqual([
      "wide",
      "tall",
    ]);
  });

  it("changes nothing for a platform that the project has", async () => {
    const harness = await harnessWithYoutubeAndTiktok();
    const revision = harness.store.read().revision;

    const again = await harness.call({
      name: "add_platform",
      arguments: { platform_id: "tiktok" },
    });

    expect(again.isError).toBe(false);
    expect(again.data).toMatchObject({ output_id: "tall", revision });
    expect(harness.store.read().revision).toBe(revision);
  });
});

describe("remove_platform", () => {
  it("keeps an output that another platform uses", async () => {
    const harness = await harnessWithYoutubeAndTiktok();
    await harness.call({
      name: "add_platform",
      arguments: { platform_id: "instagram-reel" },
    });

    await harness.call({
      name: "remove_platform",
      arguments: { platform_id: "tiktok" },
    });

    expect(outputsOf(harness)).toEqual([
      { id: "wide", platforms: ["youtube"] },
      { id: "tall", platforms: ["instagram-reel"] },
    ]);
  });

  it("removes the output of its last platform in one undo step", async () => {
    const harness = await harnessWithYoutubeAndTiktok();

    await harness.call({
      name: "remove_platform",
      arguments: { platform_id: "tiktok" },
    });

    expect(outputsOf(harness)).toEqual([
      { id: "wide", platforms: ["youtube"] },
    ]);
    await harness.call({ name: "undo" });
    expect(outputsOf(harness)).toEqual([
      { id: "wide", platforms: ["youtube"] },
      { id: "tall", platforms: ["tiktok"] },
    ]);
    expect(sceneIdsOf({ harness, outputId: "tall" })).toEqual(["tall-title"]);
  });

  it("keeps the only output of the project", async () => {
    const harness = await harnessWithYoutubeAndTiktok();
    await harness.call({
      name: "remove_platform",
      arguments: { platform_id: "tiktok" },
    });

    await harness.call({
      name: "remove_platform",
      arguments: { platform_id: "youtube" },
    });

    expect(outputsOf(harness)).toEqual([{ id: "wide", platforms: [] }]);
  });

  it("returns not-found for a platform that no output has", async () => {
    const harness = await harnessWithYoutubeAndTiktok();

    const removed = await harness.call({
      name: "remove_platform",
      arguments: { platform_id: "linkedin" },
    });

    expect(removed.isError).toBe(true);
    expect(removed.data).toMatchObject({
      kind: "not-found",
      hint: "Call get_project to see the platforms of each output.",
    });
  });
});
