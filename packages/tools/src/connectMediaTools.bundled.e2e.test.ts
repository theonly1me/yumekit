import { describe, expect, it } from "vitest";
import { readKeyStates } from "./keys/index.js";
import {
  connectFixture,
  fakeServerCommand,
  keyedServerCommand,
  sampleServerCommand,
} from "./testing/mediaToolsFixture.js";

const bundledServers = {
  sample: sampleServerCommand,
  keyed: keyedServerCommand,
  fake: fakeServerCommand,
};

const serverNames = (tools: { list: () => { server: string }[] }) =>
  tools.list().map((entry) => entry.server);

describe("connectMediaTools with the bundled servers", () => {
  it("connects every bundled server in its order when no file exists", async () => {
    const { tools } = await connectFixture({ bundledServers });

    expect(serverNames(tools)).toEqual(["sample", "keyed", "fake"]);
    expect(tools.failedServers()).toEqual([]);
  });

  it("starts a bundled server with a missing key, shows the key as missing, and uses sample for a call with no server", async () => {
    const { tools, outputDirectory } = await connectFixture({
      bundledServers: {
        sample: sampleServerCommand,
        keyed: keyedServerCommand,
      },
    });

    const keyed = tools.list().find((entry) => entry.server === "keyed");
    const variables = keyed?.description?.keys.map((key) => key.variable) ?? [];
    const outcome = await tools.run({
      capability: "speech",
      input: { text: "hello" },
      outputDirectory,
      fileStem: "line",
    });

    expect(variables).toEqual(["YUMEKIT_TEST_KEY"]);
    expect(await readKeyStates({ variables })).toEqual([
      { variable: "YUMEKIT_TEST_KEY", source: "missing" },
    ]);
    expect(outcome.ok && outcome.value.server).toBe("sample");
  });

  it("connects the servers of a file first, then each bundled server that the file does not name", async () => {
    const { tools } = await connectFixture({
      bundledServers,
      projectFile: { mcpServers: { fake: {} } },
    });

    expect(serverNames(tools)).toEqual(["fake", "sample", "keyed"]);
  });

  it("leaves out a bundled server that a file turns off with disabled", async () => {
    const { tools } = await connectFixture({
      bundledServers,
      userFile: { mcpServers: { keyed: { disabled: true } } },
      projectFile: { mcpServers: { fake: { disabled: true } } },
    });

    expect(serverNames(tools)).toEqual(["sample"]);
  });
});
