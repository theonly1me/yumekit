import { describe, expect, it } from "vitest";
import { startHarness } from "./testing/harnessFixture.js";

async function descriptionsByName(): Promise<Map<string, string>> {
  const harness = await startHarness();
  const { tools } = await harness.client.listTools();
  return new Map(tools.map((tool) => [tool.name, tool.description ?? ""]));
}

describe("tool descriptions say what the first agent run could not learn", () => {
  it("list_media_tools marks the sample server as a test server", async () => {
    const description = (await descriptionsByName()).get("list_media_tools");

    expect(description).toContain('"sample" is a free test server');
    expect(description).toContain("draws the prompt as text");
    expect(description).toContain("makes a tone");
  });

  it("place_narration names the tracks and the clip ids that it makes", async () => {
    const description = (await descriptionsByName()).get("place_narration");

    expect(description).toContain('audio track "narration"');
    expect(description).toContain('scene track "captions"');
    expect(description).toContain('"narration-<asset_id>"');
    expect(description).toContain('"captions-<asset_id>"');
  });

  it("copy_timeline says that the copy keeps the track ids and the clip ids", async () => {
    const description = (await descriptionsByName()).get("copy_timeline");

    expect(description).toContain("keeps the track ids and the clip ids");
  });

  it("list_kit_scenes says that image-pan cuts the image and has its own caption", async () => {
    const harness = await startHarness();
    const listed = await harness.call({ name: "list_kit_scenes" });

    const imagePan = /"name":"image-pan".*?"name":"caption-words"/.exec(
      JSON.stringify(listed.data),
    )?.[0];
    expect(imagePan).toContain("cuts the image to the shape of the output");
    expect(imagePan).toContain("It is not the narration caption");
  });

  it("update_clip offers scene_id and asset_id", async () => {
    const harness = await startHarness();
    const { tools } = await harness.client.listTools();
    const updateClip = tools.find((tool) => tool.name === "update_clip");

    expect(Object.keys(updateClip?.inputSchema.properties ?? {})).toEqual(
      expect.arrayContaining(["scene_id", "asset_id"]),
    );
  });

  it("generate_asset says that video costs money, has a limit, and starts from a checked still", async () => {
    const description = (await descriptionsByName()).get("generate_asset");

    expect(description).toContain("costs money for each second");
    expect(description).toContain("limits.generatedVideoSeconds");
    expect(description).toContain("generated-video-limit-reached");
    expect(description).toContain("Make a still image first");
  });

  it("place_video names the scene, the tracks, and the clip ids that it makes", async () => {
    const description = (await descriptionsByName()).get("place_video");

    expect(description).toContain('"video-<asset_id>"');
    expect(description).toContain('audio track "video-sound"');
    expect(description).toContain('"video-sound-<asset_id>"');
  });
});
