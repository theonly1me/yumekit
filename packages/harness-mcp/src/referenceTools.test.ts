import { describe, expect, it } from "vitest";
import { z } from "zod";
import { startHarness } from "./testing/harnessFixture.js";

const kitScenesSchema = z.object({
  kit_scenes: z.array(
    z.object({
      name: z.string(),
      purpose: z.string(),
      props: z.record(z.string(), z.unknown()),
    }),
  ),
});

describe("asset and reference read tools", () => {
  it("list_assets lists records without word timings, filtered by kind", async () => {
    const harness = await startHarness();
    await harness.call({
      name: "generate_asset",
      arguments: {
        asset_id: "voice",
        capability: "speech",
        input: { text: "one two" },
      },
    });
    await harness.call({
      name: "generate_asset",
      arguments: {
        asset_id: "picture",
        capability: "image",
        input: { prompt: "a fox", width_pixels: 64, height_pixels: 32 },
      },
    });

    const all = await harness.call({ name: "list_assets" });
    const images = await harness.call({
      name: "list_assets",
      arguments: { kind: "image" },
    });

    expect(all.data).toMatchObject({
      assets: [
        { id: "voice", kind: "audio", duration_frames: 18, has_words: true },
        { id: "picture", width_pixels: 64, height_pixels: 32 },
      ],
    });
    expect(JSON.stringify(all.data)).not.toContain("start_frame");
    expect(images.data).toMatchObject({ assets: [{ id: "picture" }] });
    expect(images.data["assets"]).toHaveLength(1);
  });

  it("get_asset_words gives word timings in frames from the start of the asset", async () => {
    const harness = await startHarness();
    await harness.call({
      name: "generate_asset",
      arguments: {
        asset_id: "voice",
        capability: "speech",
        input: { text: "one two three four" },
      },
    });

    const { data } = await harness.call({
      name: "get_asset_words",
      arguments: { asset_id: "voice" },
    });

    expect(data).toEqual({
      asset_id: "voice",
      duration_frames: 36,
      words: [
        { text: "one", start_frame: 0, end_frame: 9 },
        { text: "two", start_frame: 9, end_frame: 18 },
        { text: "three", start_frame: 18, end_frame: 27 },
        { text: "four", start_frame: 27, end_frame: 36 },
      ],
    });
  });

  it("list_kit_scenes gives the seven kit scenes with a JSON schema of the props", async () => {
    const harness = await startHarness();

    const { data } = await harness.call({ name: "list_kit_scenes" });

    const kitScenes = kitScenesSchema.parse(data).kit_scenes;
    expect(kitScenes.map((kitScene) => kitScene.name)).toEqual([
      "title-card",
      "bullet-list",
      "image-pan",
      "caption-words",
      "bar-chart",
      "quote",
      "video-clip",
    ]);
    expect(kitScenes[0]?.props).toMatchObject({
      type: "object",
      required: ["heading"],
      additionalProperties: false,
    });
  });

  it("get_scene_guide names each hook and animation function, the forbidden calls, and the paper colors", async () => {
    const harness = await startHarness();

    const { text } = await harness.call({ name: "get_scene_guide" });

    for (const name of [
      "defineReactScene",
      "useFrame",
      "useSceneContext",
      "useHold",
      "FrameWindow",
      "tween",
      "spring",
      "stagger",
      "seededRandom",
      "easings.cubicBezier",
      "Math.random",
      "requestAnimationFrame",
      "#eef1f4",
      "#18203a",
      "#f2b33d",
      "## Example 1",
      "## Example 2",
    ]) {
      expect(text).toContain(name);
    }
  });

  it("list_media_tools gives the sample server and its capabilities", async () => {
    const harness = await startHarness();

    const { data } = await harness.call({ name: "list_media_tools" });

    expect(data).toEqual({
      servers: [
        {
          server: "sample",
          capabilities: ["image", "speech", "align", "music", "video"],
        },
      ],
      failed_servers: [],
    });
  });
});
