import { describe, expect, it } from "vitest";
import type { MediaToolProgress } from "./types.js";
import {
  connectFixture,
  progressServerCommand,
} from "./testing/mediaToolsFixture.js";

describe("connectMediaTools progress", () => {
  it("passes each progress notification of a media server to onProgress", async () => {
    const { tools, outputDirectory } = await connectFixture({
      projectFile: { mcpServers: { progress: progressServerCommand } },
    });
    const progress: MediaToolProgress[] = [];

    const outcome = await tools.run({
      capability: "image",
      server: "progress",
      input: { prompt: "a lake" },
      outputDirectory,
      fileStem: "lake",
      onProgress: (step) => progress.push(step),
    });

    expect(outcome.ok).toBe(true);
    expect(progress).toEqual([
      { done: 1, total: 3, message: "Queued" },
      { done: 2, total: 3, message: "Drawing" },
      { done: 3, total: 3, message: "Done" },
    ]);
  });
});
