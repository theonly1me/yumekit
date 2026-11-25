import { describe, expect, it } from "vitest";
import { startHarness } from "./testing/harnessFixture.js";
import { documentedToolNames } from "./testing/documentedToolNames.js";

const titleScene = {
  scene_id: "intro",
  title: "Intro",
  kit_component: "title-card",
  props: { heading: "Hello" },
};

describe("read tools", () => {
  it("lists every tool of document 05", async () => {
    const harness = await startHarness();

    const { tools } = await harness.client.listTools();

    expect(tools.map((tool) => tool.name).sort()).toEqual(
      [...documentedToolNames].sort(),
    );
  });

  it("sends the order of work as server instructions", async () => {
    const harness = await startHarness();

    const instructions = harness.client.getInstructions() ?? "";

    expect(instructions).toContain(
      "1. Call get_work (the whole video in one text: story, shared code, scenes with their code, timelines in beats, and assets), list_kit_scenes, and list_media_tools.",
    );
    expect(instructions).toContain(
      '6. For a shot that code cannot draw, make a still image first. Check it with the person or with preview_frame. Then call generate_asset with the capability "video", first_frame_asset_id, and the camera in words in the prompt, and add the clip with place_video.',
    );
    expect(instructions).toContain("9. Call render_video for each output.");
    expect(instructions).toContain(
      "A film is a chain of meaningful actions with cause and effect, in a world that stays the same; a character that only walks through places is a failure. Hands, fingers, and movement must look natural and human, and an object must never move, double, or change sides.",
    );
    expect(instructions).toContain(
      "Then make the film in four batches, each in one generate_assets call: all sheets, all start (and end) pictures, all clips, then the music.",
    );
    expect(instructions).toContain(
      "Only a break of the design blocks: a picture with a break cannot start a clip, and a clip shows only its clean part. Every other fault is a note, and you decide.",
    );
  });

  it("get_project gives the frame rate, the outputs with their timeline length, and the scenes", async () => {
    const harness = await startHarness();
    await harness.call({ name: "put_scene", arguments: titleScene });
    await harness.call({
      name: "set_timeline",
      arguments: {
        output_id: "wide",
        tracks: [
          {
            id: "main",
            kind: "scene",
            clips: [
              { scene_id: "intro", start_frame: 10, duration_frames: 50 },
            ],
          },
        ],
      },
    });

    const { data } = await harness.call({ name: "get_project" });

    expect(data).toMatchObject({
      name: "Harness test",
      frames_per_second: 30,
      video_style: "graphics",
      outputs: [
        {
          id: "wide",
          width_pixels: 320,
          height_pixels: 180,
          length_frames: 60,
        },
      ],
      scenes: [{ id: "intro", title: "Intro", kind: "kit" }],
      revision: 2,
    });
  });

  it("get_scene gives the fields of put_scene, and the code of a module scene", async () => {
    const harness = await startHarness();
    await harness.call({ name: "put_scene", arguments: titleScene });
    const code =
      'import { defineReactScene } from "@yumekit/scene";\nexport default defineReactScene(() => <div />);\n';
    await harness.call({
      name: "put_scene",
      arguments: { scene_id: "custom", title: "Custom", code },
    });

    const kit = await harness.call({
      name: "get_scene",
      arguments: { scene_id: "intro" },
    });
    const custom = await harness.call({
      name: "get_scene",
      arguments: { scene_id: "custom" },
    });

    expect(kit.data).toEqual({
      id: "intro",
      title: "Intro",
      notes: "",
      kind: "kit",
      kit_component: "title-card",
      props: { heading: "Hello" },
    });
    expect(custom.data).toMatchObject({ kind: "module", code, props: {} });
  });

  it("get_timeline gives tracks in snake_case with the default clip fields", async () => {
    const harness = await startHarness();
    await harness.call({ name: "put_scene", arguments: titleScene });
    await harness.call({
      name: "set_timeline",
      arguments: {
        output_id: "wide",
        tracks: [
          {
            id: "main",
            kind: "scene",
            clips: [
              {
                id: "a",
                scene_id: "intro",
                start_frame: 0,
                duration_frames: 30,
              },
            ],
          },
        ],
      },
    });

    const { data } = await harness.call({
      name: "get_timeline",
      arguments: { output_id: "wide" },
    });

    expect(data).toEqual({
      output_id: "wide",
      length_frames: 30,
      tracks: [
        {
          id: "main",
          kind: "scene",
          off: false,
          clips: [
            {
              id: "a",
              scene_id: "intro",
              start_frame: 0,
              duration_frames: 30,
              scene_start_frame: 0,
            },
          ],
        },
      ],
    });
  });
});
