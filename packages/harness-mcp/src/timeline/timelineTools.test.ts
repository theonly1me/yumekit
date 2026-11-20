import type { AudioClip, SceneClip } from "@yumekit/project";
import { describe, expect, it } from "vitest";
import { startHarness, type Harness } from "../testing/harnessFixture.js";

async function harnessWithScene(): Promise<Harness> {
  const harness = await startHarness();
  await harness.call({
    name: "put_scene",
    arguments: {
      scene_id: "intro",
      title: "Intro",
      kit_component: "title-card",
      props: { heading: "Hi" },
    },
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
            { id: "a", scene_id: "intro", start_frame: 0, duration_frames: 30 },
          ],
        },
      ],
    },
  });
  return harness;
}

function clipsOf(harness: Harness) {
  const [timeline] = harness.store.read().timelines;
  return (
    timeline?.tracks.flatMap<SceneClip | AudioClip>((track) => track.clips) ??
    []
  );
}

describe("timeline tools", () => {
  it("set_timeline stores clips with sceneStartFrame 0 when it is missing", async () => {
    const harness = await harnessWithScene();

    expect(clipsOf(harness)).toEqual([
      {
        id: "a",
        sceneId: "intro",
        startFrame: 0,
        durationFrames: 30,
        sceneStartFrame: 0,
      },
    ]);
  });

  it("add_clip adds a clip after the first, update_clip moves it, and remove_clip removes it", async () => {
    const harness = await harnessWithScene();

    const added = await harness.call({
      name: "add_clip",
      arguments: {
        output_id: "wide",
        track_id: "main",
        clip_id: "b",
        scene_id: "intro",
        start_frame: 30,
        duration_frames: 15,
      },
    });
    const afterAdd = clipsOf(harness);
    await harness.call({
      name: "update_clip",
      arguments: { output_id: "wide", clip_id: "b", start_frame: 40 },
    });
    const afterUpdate = clipsOf(harness);
    await harness.call({
      name: "remove_clip",
      arguments: { output_id: "wide", clip_id: "b" },
    });

    expect(added.data).toMatchObject({ clip_id: "b" });
    expect(afterAdd.map((clip) => clip.id)).toEqual(["a", "b"]);
    expect(afterUpdate[1]).toMatchObject({
      startFrame: 40,
      durationFrames: 15,
    });
    expect(clipsOf(harness).map((clip) => clip.id)).toEqual(["a"]);
  });

  it("add_clip that overlaps returns clips-overlap and a hint about frames and other tracks", async () => {
    const harness = await harnessWithScene();

    const result = await harness.call({
      name: "add_clip",
      arguments: {
        output_id: "wide",
        track_id: "main",
        scene_id: "intro",
        start_frame: 29,
        duration_frames: 5,
      },
    });

    expect(result.data["kind"]).toBe("clips-overlap");
    expect(result.data["hint"]).toContain("start_frame + duration_frames - 1");
    expect(result.data["hint"]).toContain("update_clip");
  });

  it("add_clip without scene_id and asset_id says which one to give", async () => {
    const harness = await harnessWithScene();

    const result = await harness.call({
      name: "add_clip",
      arguments: {
        output_id: "wide",
        track_id: "main",
        start_frame: 40,
        duration_frames: 5,
      },
    });

    expect(result.data["kind"]).toBe("clip-target-missing");
    expect(result.data["hint"]).toContain("get_timeline");
  });

  it("copy_timeline copies the clips of one output to another", async () => {
    const harness = await harnessWithScene();
    await harness.call({
      name: "add_output",
      arguments: {
        output_id: "tall",
        label: "Tall",
        width_pixels: 180,
        height_pixels: 320,
      },
    });

    await harness.call({
      name: "copy_timeline",
      arguments: { from_output_id: "wide", to_output_id: "tall" },
    });

    const tall = await harness.call({
      name: "get_timeline",
      arguments: { output_id: "tall" },
    });
    expect(tall.data).toMatchObject({ output_id: "tall", length_frames: 30 });
  });

  it("get_timeline of an unknown output lists the output ids", async () => {
    const harness = await harnessWithScene();

    const result = await harness.call({
      name: "get_timeline",
      arguments: { output_id: "square" },
    });

    expect(result.data["kind"]).toBe("output-not-found");
    expect(result.data["hint"]).toContain("wide");
    expect(result.data["hint"]).toContain("add_output");
  });

  it("undo reverts the last change, redo applies it again, and an empty history gives a hint", async () => {
    const harness = await startHarness();
    const nothing = await harness.call({ name: "undo" });
    await harness.call({ name: "set_script", arguments: { script: "one" } });
    await harness.call({ name: "set_script", arguments: { script: "two" } });

    await harness.call({ name: "undo" });
    const undone = harness.store.read().script;
    await harness.call({ name: "redo" });
    const noRedo = await harness.call({ name: "redo" });

    expect(nothing.data).toMatchObject({ kind: "nothing-to-undo" });
    expect(nothing.data["hint"]).toContain("get_project");
    expect(undone).toBe("one");
    expect(harness.store.read().script).toBe("two");
    expect(noRedo.data).toMatchObject({ kind: "nothing-to-redo" });
  });
});
