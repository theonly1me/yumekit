import type { Progress } from "@modelcontextprotocol/sdk/types.js";
import { describe, expect, it } from "vitest";
import type { HarnessProgress } from "../index.js";
import { startFunctionHarness } from "../testing/functionHarness.js";
import {
  progressServerCommand,
  startHarness,
} from "../testing/harnessFixture.js";

const progressFile = {
  mcpServers: { sample: {}, progress: progressServerCommand },
};

const imageFromProgressServer = {
  asset_id: "lake",
  capability: "image",
  server: "progress",
  input: { prompt: "a lake" },
};

describe("createHarness progress", () => {
  it("onProgress reports the frames of render_video", async () => {
    const { harness } = await startFunctionHarness();
    await harness.call({
      name: "put_scene",
      input: {
        scene_id: "intro",
        title: "Intro",
        kit_component: "title-card",
        props: { heading: "Frames" },
      },
    });
    await harness.call({
      name: "set_timeline",
      input: {
        output_id: "wide",
        tracks: [
          {
            id: "main",
            kind: "scene",
            clips: [{ scene_id: "intro", start_frame: 0, duration_frames: 20 }],
          },
        ],
      },
    });
    const progress: HarnessProgress[] = [];

    const rendered = await harness.call({
      name: "render_video",
      input: { output_id: "wide", frame_count: 6, scale: 0.25 },
      onProgress: (step) => progress.push(step),
    });

    expect(rendered.isError).toBe(false);
    expect(progress.at(-1)).toEqual({ done: 6, total: 6 });
    expect(progress.every((step) => step.total === 6)).toBe(true);
    for (const [index, step] of progress.entries()) {
      expect(step.done).toBeGreaterThan(progress[index - 1]?.done ?? 0);
    }
  }, 120_000);

  it("onProgress reports the progress that a media server sends", async () => {
    const { harness } = await startFunctionHarness({
      mediaToolsFile: progressFile,
    });
    const progress: HarnessProgress[] = [];

    const made = await harness.call({
      name: "generate_asset",
      input: imageFromProgressServer,
      onProgress: (step) => progress.push(step),
    });

    expect(made.isError).toBe(false);
    expect(progress).toEqual([
      { done: 1, total: 3, message: "Queued" },
      { done: 2, total: 3, message: "Drawing" },
      { done: 3, total: 3, message: "Done" },
    ]);
  });

  it("the MCP server forwards the progress of a media server as notifications", async () => {
    const harness = await startHarness({ mediaToolsFile: progressFile });
    const progress: Progress[] = [];

    await harness.client.callTool(
      { name: "generate_asset", arguments: imageFromProgressServer },
      undefined,
      { onprogress: (notification) => progress.push(notification) },
    );

    expect(progress).toEqual([
      { progress: 1, total: 3, message: "Queued" },
      { progress: 2, total: 3, message: "Drawing" },
      { progress: 3, total: 3, message: "Done" },
    ]);
  });
});
