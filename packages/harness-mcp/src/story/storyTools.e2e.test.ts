import { describe, expect, it } from "vitest";
import { startHarness } from "../testing/harnessFixture.js";

const moduleCode =
  'import { defineReactScene } from "@yumekit/scene";\nexport default defineReactScene(() => <div />);\n';

describe("story tools", () => {
  it("set_script replaces the script", async () => {
    const harness = await startHarness();

    const { isError } = await harness.call({
      name: "set_script",
      arguments: { script: "A short story." },
    });

    expect(isError).toBe(false);
    expect(harness.store.read().script).toBe("A short story.");
  });

  it("set_bible stores the cast as people with an empty list of reference asset ids by default", async () => {
    const harness = await startHarness();

    await harness.call({
      name: "set_bible",
      arguments: {
        style: "paper cutouts",
        palette: ["#18203a"],
        voice: "calm",
        cast: [{ id: "fox", name: "Fox", description: "A red fox" }],
      },
    });

    expect(harness.store.read().bible).toEqual({
      style: "paper cutouts",
      palette: ["#18203a"],
      voice: "calm",
      cast: [
        {
          id: "fox",
          kind: "person",
          name: "Fox",
          description: "A red fox",
          referenceAssetIds: [],
        },
      ],
    });
  });

  it("add_output adds an output with an empty timeline, and remove_output removes it", async () => {
    const harness = await startHarness();

    await harness.call({
      name: "add_output",
      arguments: {
        output_id: "tall",
        label: "Tall",
        width_pixels: 180,
        height_pixels: 320,
      },
    });
    const added = harness.store.read();
    await harness.call({
      name: "remove_output",
      arguments: { output_id: "tall" },
    });

    expect(added.project.outputs.map((output) => output.id)).toEqual([
      "wide",
      "tall",
    ]);
    expect(added.timelines.map((timeline) => timeline.outputId)).toContain(
      "tall",
    );
    expect(
      harness.store.read().project.outputs.map((output) => output.id),
    ).toEqual(["wide"]);
  });

  it("add_output with an odd size returns invalid-value and a hint about even sizes", async () => {
    const harness = await startHarness();

    const result = await harness.call({
      name: "add_output",
      arguments: {
        output_id: "odd",
        label: "Odd",
        width_pixels: 181,
        height_pixels: 320,
      },
    });

    expect(result.isError).toBe(true);
    expect(result.data["kind"]).toBe("invalid-value");
    expect(result.data["hint"]).toContain("even numbers from 16 to 7680");
  });

  it("put_scene stores a kit scene and a module scene with its code", async () => {
    const harness = await startHarness();

    await harness.call({
      name: "put_scene",
      arguments: {
        scene_id: "intro",
        title: "Intro",
        notes: "Opens the video",
        kit_component: "title-card",
        props: { heading: "Hello" },
      },
    });
    await harness.call({
      name: "put_scene",
      arguments: { scene_id: "custom", title: "Custom", code: moduleCode },
    });

    const snapshot = harness.store.read();
    expect(snapshot.scenes).toEqual([
      {
        id: "custom",
        title: "Custom",
        notes: "",
        source: { kind: "module", props: {} },
      },
      {
        id: "intro",
        title: "Intro",
        notes: "Opens the video",
        source: {
          kind: "kit",
          component: "title-card",
          props: { heading: "Hello" },
        },
      },
    ]);
    expect(snapshot.sceneCode["custom"]).toBe(moduleCode);
  });

  it("remove_scene removes a scene, and names the clip and the next step while a clip shows it", async () => {
    const harness = await startHarness();
    await harness.call({
      name: "put_scene",
      arguments: { scene_id: "used", title: "Used", code: moduleCode },
    });
    await harness.call({
      name: "put_scene",
      arguments: { scene_id: "unused", title: "Unused", code: moduleCode },
    });
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
                id: "c1",
                scene_id: "used",
                start_frame: 0,
                duration_frames: 9,
              },
            ],
          },
        ],
      },
    });

    const removed = await harness.call({
      name: "remove_scene",
      arguments: { scene_id: "unused" },
    });
    const blocked = await harness.call({
      name: "remove_scene",
      arguments: { scene_id: "used" },
    });

    expect(removed.isError).toBe(false);
    expect(blocked.data).toMatchObject({ kind: "still-referenced" });
    expect(blocked.data["message"]).toContain("c1");
    expect(blocked.data["hint"]).toContain("remove_clip");
    expect(harness.store.read().scenes.map((scene) => scene.id)).toEqual([
      "used",
    ]);
  });
});
