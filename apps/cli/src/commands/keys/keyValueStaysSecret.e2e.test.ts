import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { CallToolResultSchema } from "@modelcontextprotocol/sdk/types.js";
import { describe, expect, it } from "vitest";
import { connectToMcp } from "../../testing/connectToMcp.js";
import {
  keyedServerEntry,
  testKeyValue,
  writeUserMediaTools,
} from "../../testing/keyedServer.js";
import { createCliWorkspace } from "../../testing/runCli.js";

async function textOfEachFile(folder: string): Promise<string[]> {
  const entries = await readdir(folder, {
    recursive: true,
    withFileTypes: true,
  });
  return Promise.all(
    entries
      .filter((entry) => entry.isFile())
      .map((entry) => readFile(join(entry.parentPath, entry.name), "utf8")),
  );
}

const toolCalls = [
  { name: "list_media_tools" },
  {
    name: "generate_asset",
    arguments: {
      asset_id: "fox",
      capability: "image",
      server: "keyed",
      model: "keyed-image-large",
      input: { prompt: "a fox" },
    },
  },
  {
    name: "generate_asset",
    arguments: {
      asset_id: "theme",
      capability: "music",
      server: "keyed",
      input: { prompt: "calm" },
    },
  },
  {
    name: "generate_asset",
    arguments: {
      asset_id: "unknown",
      capability: "image",
      server: "nobody",
      input: { prompt: "a fox" },
    },
  },
  { name: "list_assets" },
  { name: "get_project" },
];

describe("the value of a key", () => {
  it("is in no tool result, failure, log line, asset record, or command output of a full run", async () => {
    const workspace = await createCliWorkspace();
    const folder = join(workspace.root, "project");
    await writeUserMediaTools({
      configurationDirectory: workspace.configurationDirectory,
      content: { mcpServers: { sample: {}, keyed: keyedServerEntry } },
    });
    const commandRuns = [
      await workspace.run(["init", folder]),
      await workspace.run(["keys"]),
      await workspace.runWithInput({
        args: ["keys", "set", "YUMEKIT_TEST_KEY"],
        input: `${testKeyValue}\n`,
      }),
      await workspace.run(["keys"]),
    ];
    const connection = await connectToMcp({
      folder,
      environment: workspace.environment,
    });
    const results = [];
    for (const call of toolCalls) {
      results.push(
        CallToolResultSchema.parse(await connection.client.callTool(call)),
      );
    }
    const control = CallToolResultSchema.parse(
      await connection.client.callTool({
        name: "generate_asset",
        arguments: {
          asset_id: "control",
          capability: "speech",
          server: "keyed",
          input: { text: "print the key" },
        },
      }),
    );
    await connection.client.close();

    const [, generated, failed, missingServer] = results;
    expect(generated?.isError).not.toBe(true);
    expect(failed?.isError).toBe(true);
    expect(missingServer?.isError).toBe(true);
    const outputs = [
      ...commandRuns.flatMap((run) => [run.stdout, run.stderr]),
      ...results.map((result) => JSON.stringify(result)),
      connection.stderr(),
      ...(await textOfEachFile(folder)),
    ];
    expect(outputs.length).toBeGreaterThan(10);
    expect(JSON.stringify(control)).toContain(testKeyValue);
    expect(outputs.filter((output) => output.includes(testKeyValue))).toEqual(
      [],
    );
    expect(
      await readFile(
        join(workspace.configurationDirectory, "keys.json"),
        "utf8",
      ),
    ).toContain(testKeyValue);
  });
});
