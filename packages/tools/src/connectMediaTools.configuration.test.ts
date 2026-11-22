import { describe, expect, it, vi } from "vitest";
import { join } from "node:path";
import {
  connectFixture,
  connectFixtureOutcome,
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

    expect(tools.list()).toMatchObject([
      {
        server: "fake",
        capabilities: ["image", "speech", "music", "video"],
      },
      {
        server: "sample",
        capabilities: ["image", "speech", "align", "music", "video"],
      },
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

  it("uses another ready server before sample when no default exists", async () => {
    const { tools, outputDirectory } = await connectFixture({
      projectFile: { mcpServers: { sample: {}, fake: fakeServerCommand } },
    });

    const outcome = await tools.run({ ...speechRequest, outputDirectory });

    expect(outcome.ok ? "sample" : outcome.failure).toMatchObject({
      kind: "media-tool-failed",
      server: "fake",
    });
  });

  it("reports the default server that it used for a request with no server", async () => {
    const { tools, outputDirectory } = await connectFixture({
      projectFile: {
        mcpServers: { fake: fakeServerCommand, sample: {} },
        defaults: { speech: "sample" },
      },
    });

    const outcome = await tools.run({ ...speechRequest, outputDirectory });

    expect(outcome.ok && outcome.value.server).toBe("sample");
    expect(outcome.ok && outcome.value.result.files).toHaveLength(1);
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

  it("returns invalid-configuration-file for a file that does not match the schema", async () => {
    const { outcome, projectFolder } = await connectFixtureOutcome({
      projectFile: { mcpServers: { sample: { args: "x" } } },
    });

    if (outcome.ok) throw new Error("Expected a failure");
    expect(outcome.failure.kind).toBe("invalid-configuration-file");
    expect(outcome.failure.file).toBe(join(projectFolder, "media-tools.json"));
    expect(outcome.failure.message).toMatch(/mcpServers\.sample\.args/);
  });

  it("returns invalid-configuration-file for a user file that is not JSON", async () => {
    const { outcome, home } = await connectFixtureOutcome({
      userFile: "{ not json",
      projectFile: { mcpServers: { sample: {} } },
    });

    if (outcome.ok) throw new Error("Expected a failure");
    expect(outcome.failure).toMatchObject({
      kind: "invalid-configuration-file",
      file: join(home, ".config", "yumekit", "media-tools.json"),
    });
  });
});
