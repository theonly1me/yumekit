import { describe, expect, it } from "vitest";
import { startHarness } from "../testing/harnessFixture.js";

describe("the video style tools", () => {
  it("set_video_style changes the style that get_project gives", async () => {
    const harness = await startHarness();

    const changed = await harness.call({
      name: "set_video_style",
      arguments: { video_style: "ai-video" },
    });
    const { data } = await harness.call({ name: "get_project" });

    expect(changed.data).toMatchObject({ video_style: "ai-video" });
    expect(data).toMatchObject({ video_style: "ai-video" });
  });

  it("set_video_style is one undo step", async () => {
    const harness = await startHarness();
    await harness.call({
      name: "set_video_style",
      arguments: { video_style: "mix" },
    });
    await harness.call({
      name: "set_video_style",
      arguments: { video_style: "ai-video" },
    });

    await harness.call({ name: "undo" });
    const { data } = await harness.call({ name: "get_project" });

    expect(data).toMatchObject({ video_style: "mix" });
  });

  it("set_video_style refuses a style that is not in the list", async () => {
    const harness = await startHarness();

    const refused = await harness.call({
      name: "set_video_style",
      arguments: { video_style: "cartoon" },
    });

    expect(refused.isError).toBe(true);
    expect(harness.store.read().project).not.toHaveProperty("videoStyle");
  });
});
