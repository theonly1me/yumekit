import { describe, expect, it } from "vitest";
import { startHarness } from "../testing/harnessFixture.js";

const code =
  'import { defineReactScene } from "@yumekit/scene";\nexport default defineReactScene(() => <div />);\n';

describe("duplicate_scene_clip with a custom scene", () => {
  it("copies the code of the scene to the copy", async () => {
    const harness = await startHarness();
    await harness.call({
      name: "put_scene",
      arguments: { scene_id: "custom", title: "Custom", code, props: {} },
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
                id: "only",
                scene_id: "custom",
                start_frame: 0,
                duration_frames: 30,
              },
            ],
          },
        ],
      },
    });

    const duplicated = await harness.call({
      name: "duplicate_scene_clip",
      arguments: { clip_id: "only" },
    });

    const snapshot = harness.store.read();
    expect(duplicated.data["scene_ids"]).toEqual(["custom-copy"]);
    expect(snapshot.sceneCode["custom-copy"]).toBe(code);
    expect(
      snapshot.scenes.find((scene) => scene.id === "custom-copy")?.source,
    ).toEqual({ kind: "module", props: {} });
  });
});
