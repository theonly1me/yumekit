import { describe, expect, it } from "vitest";
import { startHarness } from "../testing/harnessFixture.js";
import {
  harnessWithYoutubeAndTiktok,
  sceneIdsOf,
} from "../testing/platformFixture.js";

describe("add_platform with a tie", () => {
  it("copies the first output in project order when two shapes are equally near", async () => {
    const harness = await startHarness({
      outputs: [
        { id: "flat", label: "Flat", widthPixels: 300, heightPixels: 200 },
        { id: "narrow", label: "Narrow", widthPixels: 100, heightPixels: 200 },
      ],
    });
    await harness.call({
      name: "put_scene",
      arguments: {
        scene_id: "flat-title",
        title: "Flat",
        kit_component: "title-card",
        props: { heading: "Flat" },
      },
    });
    await harness.call({
      name: "set_timeline",
      arguments: {
        output_id: "flat",
        tracks: [
          {
            id: "main",
            kind: "scene",
            clips: [
              { scene_id: "flat-title", start_frame: 0, duration_frames: 6 },
            ],
          },
        ],
      },
    });

    await harness.call({
      name: "add_platform",
      arguments: { platform_id: "square" },
    });

    expect(sceneIdsOf({ harness, outputId: "square" })).toEqual(["flat-title"]);
  });
});

describe("platforms for an agent", () => {
  it("get_project shows the platforms of each output", async () => {
    const harness = await harnessWithYoutubeAndTiktok();

    const { data } = await harness.call({ name: "get_project" });

    expect(data).toMatchObject({
      outputs: [
        { id: "wide", platforms: ["youtube"] },
        { id: "tall", platforms: ["tiktok"] },
      ],
    });
  });

  it("the descriptions send a platform to add_platform and a custom size to add_output", async () => {
    const harness = await startHarness();
    const { tools } = await harness.client.listTools();
    const descriptionOf = (name: string) =>
      tools.find((tool) => tool.name === name)?.description ?? "";

    expect(descriptionOf("add_output")).toContain(
      "For a platform such as YouTube, TikTok, or Instagram, call add_platform instead.",
    );
    expect(descriptionOf("add_platform")).toContain(
      "Use add_output only for a custom size.",
    );
  });
});
