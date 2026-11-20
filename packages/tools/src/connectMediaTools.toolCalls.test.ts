import { describe, expect, it } from "vitest";
import {
  connectFixture,
  fakeServerCommand,
} from "./testing/mediaToolsFixture.js";

describe("connectMediaTools tool calls", () => {
  it("returns media-tool-timeout when a server does not answer within toolTimeoutSeconds", async () => {
    const { tools, outputDirectory } = await connectFixture({
      projectFile: { mcpServers: { fake: fakeServerCommand } },
      toolTimeoutSeconds: 1,
    });
    const startedAt = Date.now();

    const outcome = await tools.run({
      capability: "video",
      input: { prompt: "waves", duration_seconds: 2 },
      outputDirectory,
      fileStem: "waves",
    });

    expect(outcome).toEqual({
      ok: false,
      failure: {
        kind: "media-tool-timeout",
        server: "fake",
        timeoutSeconds: 1,
      },
    });
    expect(Date.now() - startedAt).toBeLessThan(5000);
  });

  it("returns media-tool-invalid-result for a file path outside the output directory", async () => {
    const { tools, outputDirectory } = await connectFixture({
      projectFile: { mcpServers: { fake: fakeServerCommand } },
    });

    const outcome = await tools.run({
      capability: "music",
      input: { prompt: "calm piano", duration_seconds: 2 },
      outputDirectory,
      fileStem: "theme",
    });

    if (outcome.ok) throw new Error("Expected a failure");
    expect(outcome.failure).toMatchObject({
      kind: "media-tool-invalid-result",
      server: "fake",
    });
    expect("message" in outcome.failure && outcome.failure.message).toMatch(
      /outside\.wav/,
    );
  });
});
