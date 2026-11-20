import { describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { saveKey } from "./keys/index.js";
import {
  connectFixture,
  keyedServerCommand,
  testKeyValue,
} from "./testing/mediaToolsFixture.js";
import type { MediaTools } from "./types.js";

const environmentReport = z.object({
  key: z.string().nullable(),
  not_passed: z.string().nullable(),
  model: z.string().nullable(),
  process_id: z.number(),
});

async function reportOf(options: {
  tools: MediaTools;
  server: string;
  outputDirectory: string;
}) {
  const outcome = await options.tools.run({
    capability: "speech",
    server: options.server,
    input: { text: "report" },
    outputDirectory: options.outputDirectory,
    fileStem: "report",
  });
  if (outcome.ok || outcome.failure.kind !== "media-tool-failed") {
    throw new Error("Expected the report as a failure message");
  }
  return environmentReport.parse(JSON.parse(outcome.failure.message));
}

const twoKeyedServers = {
  mcpServers: { first: keyedServerCommand, second: keyedServerCommand },
};

describe("connectMediaTools keys", () => {
  it("gives a server its key from the key file and no variable outside passEnvironment", async () => {
    vi.stubEnv("YUMEKIT_NOT_PASSED", "made-up-not-passed");
    const { tools, outputDirectory } = await connectFixture({
      projectFile: twoKeyedServers,
      beforeConnect: () =>
        saveKey({ variable: "YUMEKIT_TEST_KEY", value: testKeyValue }),
    });

    const report = await reportOf({ tools, server: "first", outputDirectory });

    expect(report.key).toBe(testKeyValue);
    expect(report.not_passed).toBeNull();
  });

  it("returns media-key-missing with the steps and calls no tool when the key is missing", async () => {
    const { tools, outputDirectory } = await connectFixture({
      projectFile: twoKeyedServers,
    });

    const outcome = await tools.run({
      capability: "image",
      server: "first",
      input: { prompt: "a fox" },
      outputDirectory,
      fileStem: "fox",
    });

    expect(outcome).toEqual({
      ok: false,
      failure: {
        kind: "media-key-missing",
        server: "first",
        variable: "YUMEKIT_TEST_KEY",
        getKeyUrl: "https://example.com/keys",
        steps: ["Open the key page.", "Copy the key."],
      },
    });
  });

  it("starts again only the server whose key changed, and no other server stops", async () => {
    const { tools, outputDirectory } = await connectFixture({
      projectFile: {
        mcpServers: {
          first: keyedServerCommand,
          second: { ...keyedServerCommand, passEnvironment: [] },
        },
      },
      beforeConnect: () =>
        saveKey({ variable: "YUMEKIT_TEST_KEY", value: "made-up-old-value" }),
    });
    const first = await reportOf({ tools, server: "first", outputDirectory });
    const second = await reportOf({ tools, server: "second", outputDirectory });

    await saveKey({ variable: "YUMEKIT_TEST_KEY", value: testKeyValue });
    const firstAfter = await reportOf({
      tools,
      server: "first",
      outputDirectory,
    });
    const secondAfter = await reportOf({
      tools,
      server: "second",
      outputDirectory,
    });

    expect(first.key).toBe("made-up-old-value");
    expect(firstAfter.key).toBe(testKeyValue);
    expect(firstAfter.process_id).not.toBe(first.process_id);
    expect(secondAfter.process_id).toBe(second.process_id);
  });
});
