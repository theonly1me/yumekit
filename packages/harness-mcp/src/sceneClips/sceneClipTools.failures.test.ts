import { describe, expect, it } from "vitest";
import { harnessWithThreeScenes } from "../testing/sceneClipFixture.js";

const toolCalls = [
  { name: "resize_scene_clip", extra: { duration_frames: 10 } },
  { name: "move_scene_clip", extra: { to_index: 0 } },
  { name: "remove_scene_clip", extra: {} },
  { name: "duplicate_scene_clip", extra: {} },
];

describe("the scene clip tools refuse a clip that they cannot change", () => {
  it.each(toolCalls)(
    "$name refuses an unknown clip id with clip-not-found",
    async ({ name, extra }) => {
      const harness = await harnessWithThreeScenes();

      const refused = await harness.call({
        name,
        arguments: { clip_id: "missing", ...extra },
      });

      expect(refused.isError).toBe(true);
      expect(refused.data["kind"]).toBe("clip-not-found");
      expect(refused.data["hint"]).toContain("get_timeline");
    },
  );

  it.each(toolCalls)(
    "$name refuses a clip that is not on the scenes row",
    async ({ name, extra }) => {
      const harness = await harnessWithThreeScenes({ withVoice: true });
      const before = harness.store.read().revision;

      const refused = await harness.call({
        name,
        arguments: { clip_id: "captions-line", ...extra },
      });

      expect(refused.data["kind"]).toBe("clip-not-on-scenes-row");
      expect(refused.data["hint"]).toContain("update_clip");
      expect(harness.store.read().revision).toBe(before);
    },
  );

  it("refuses an unknown output in output_ids with output-not-found", async () => {
    const harness = await harnessWithThreeScenes();

    const refused = await harness.call({
      name: "remove_scene_clip",
      arguments: { output_ids: ["square"], clip_id: "one" },
    });

    expect(refused.data["kind"]).toBe("output-not-found");
  });
});
