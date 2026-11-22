import { describe, expect, it } from "vitest";
import { startHarness, type ToolCall } from "../testing/harnessFixture.js";
import { pngSizeOf } from "../testing/probeVideo.js";
import { tallOutput } from "../testing/sceneClipFixture.js";

const renderTimeout = 120_000;

async function tallHarnessWithUnplacedScene() {
  const harness = await startHarness({ outputs: [tallOutput] });
  await harness.call({
    name: "put_scene",
    arguments: {
      scene_id: "intro",
      title: "Intro",
      kit_component: "title-card",
      props: { heading: "Alone" },
    },
  });
  return harness;
}

function imagesOf(call: ToolCall) {
  return call.result.content.flatMap((content) =>
    content.type === "image" ? [content] : [],
  );
}

describe("preview_scenes", () => {
  it(
    "draws a scene with no clip at the size of the output and the scale",
    async () => {
      const harness = await tallHarnessWithUnplacedScene();

      const result = await harness.call({
        name: "preview_scenes",
        arguments: { output_id: "tall", scene_ids: ["intro"], scale: 0.5 },
      });

      expect(result.isError).toBe(false);
      expect(imagesOf(result).map((image) => pngSizeOf(image.data))).toEqual([
        { width: 90, height: 160 },
      ]);
      expect(result.data).toMatchObject({
        pictures: [{ scene_id: "intro", frame: 68 }],
      });
    },
    renderTimeout,
  );

  it(
    "draws a given frame of the entry, and the last frame for a frame past the end",
    async () => {
      const harness = await tallHarnessWithUnplacedScene();

      const entry = await harness.call({
        name: "preview_scenes",
        arguments: { output_id: "tall", scene_ids: ["intro"], frame: 10 },
      });
      const settled = await harness.call({
        name: "preview_scenes",
        arguments: { output_id: "tall", scene_ids: ["intro"] },
      });
      const pastTheEnd = await harness.call({
        name: "preview_scenes",
        arguments: { output_id: "tall", scene_ids: ["intro"], frame: 500 },
      });

      expect(entry.data).toMatchObject({ pictures: [{ frame: 10 }] });
      expect(pastTheEnd.data).toMatchObject({ pictures: [{ frame: 89 }] });
      expect(imagesOf(entry)[0]?.data).not.toBe(imagesOf(settled)[0]?.data);
    },
    renderTimeout,
  );

  it("gives scene-not-found for an unknown scene id", async () => {
    const harness = await tallHarnessWithUnplacedScene();

    const result = await harness.call({
      name: "preview_scenes",
      arguments: { output_id: "tall", scene_ids: ["intro", "missing"] },
    });

    expect(result.isError).toBe(true);
    expect(result.data["kind"]).toBe("scene-not-found");
  });
});
