import { describe, expect, it, vi } from "vitest";
import {
  connectFixture,
  fakeServerCommand,
  missingServerCommand,
  sampleServerCommand,
} from "./testing/mediaToolsFixture.js";

const speechRequest = {
  capability: "speech",
  input: { text: "hello" },
  fileStem: "line",
} as const;

describe("connectMediaTools configuration", () => {
  it("lets the project file win over the user file for a server with the same name", async () => {
    const { tools } = await connectFixture({
      userFile: { mcpServers: { sample: missingServerCommand } },
      projectFile: { mcpServers: { sample: sampleServerCommand } },
    });

    expect(tools.list().map((entry) => entry.server)).toEqual(["sample"]);
  });

  it("connects the servers of both files", async () => {
    const { tools } = await connectFixture({
      userFile: { mcpServers: { fake: fakeServerCommand } },
      projectFile: { mcpServers: { sample: {} } },
    });

    expect(tools.list()).toEqual([
      { server: "fake", capabilities: ["image", "speech"] },
      { server: "sample", capabilities: ["image", "speech", "align", "music"] },
    ]);
  });

  it("uses the default server for a capability when the request names no server", async () => {
    const { tools, outputDirectory } = await connectFixture({
      projectFile: {
        mcpServers: { sample: {}, fake: fakeServerCommand },
        defaults: { speech: "fake" },
      },
    });

    const outcome = await tools.run({ ...speechRequest, outputDirectory });

    expect(outcome.ok ? "sample" : outcome.failure).toMatchObject({
      kind: "media-tool-failed",
      server: "fake",
    });
  });

  it("uses the first server with the capability when no default exists", async () => {
    const { tools, outputDirectory } = await connectFixture({
      projectFile: { mcpServers: { sample: {}, fake: fakeServerCommand } },
    });

    const outcome = await tools.run({ ...speechRequest, outputDirectory });

    expect(outcome.ok).toBe(true);
  });

  it("passes only the environment variables that passEnvironment names", async () => {
    vi.stubEnv("YUMEKIT_FAKE_PASSED", "from-parent");
    const { tools, outputDirectory } = await connectFixture({
      projectFile: {
        mcpServers: {
          passed: {
            ...fakeServerCommand,
            passEnvironment: ["YUMEKIT_FAKE_PASSED"],
          },
          hidden: fakeServerCommand,
        },
      },
    });

    const passed = await tools.run({
      ...speechRequest,
      server: "passed",
      outputDirectory,
    });
    const hidden = await tools.run({
      ...speechRequest,
      server: "hidden",
      outputDirectory,
    });

    expect(passed.ok ? "" : passed.failure).toMatchObject({
      message: "YUMEKIT_FAKE_PASSED is from-parent",
    });
    expect(hidden.ok ? "" : hidden.failure).toMatchObject({
      message: "YUMEKIT_FAKE_PASSED is not set",
    });
  });

  it("returns server-failed-to-start for an entry with no command that names no bundled server", async () => {
    const { tools, outputDirectory } = await connectFixture({
      projectFile: { mcpServers: { unknown: {} } },
    });

    const outcome = await tools.run({
      ...speechRequest,
      server: "unknown",
      outputDirectory,
    });

    expect(outcome).toEqual({
      ok: false,
      failure: {
        kind: "server-failed-to-start",
        server: "unknown",
        message:
          'Server "unknown" has no command, and no bundled server has that name',
      },
    });
  });

  it("rejects a media tools file that does not match the schema", async () => {
    await expect(
      connectFixture({
        projectFile: { mcpServers: { sample: { args: "x" } } },
      }),
    ).rejects.toThrow(/media-tools\.json is not a valid media tools file/);
  });
});
