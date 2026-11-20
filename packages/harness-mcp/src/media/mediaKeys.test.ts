import { readdir } from "node:fs/promises";
import { join } from "node:path";
import { saveKey } from "@yumekit/tools";
import { describe, expect, it } from "vitest";
import { keyedServerCommand, startHarness } from "../testing/harnessFixture.js";

const keyedFile = { mcpServers: { sample: {}, keyed: keyedServerCommand } };

const keyGuide = {
  variable: "YUMEKIT_TEST_KEY",
  label: "Test key",
  get_key_url: "https://example.com/keys",
  steps: ["Open the key page.", "Copy the key."],
};

async function filesIn(folder: string): Promise<string[]> {
  return readdir(folder).catch(() => []);
}

describe("media keys in the harness", () => {
  it("list_media_tools gives the description and the state of each key, with the guide", async () => {
    const harness = await startHarness({ mediaToolsFile: keyedFile });

    const listed = await harness.call({ name: "list_media_tools" });

    expect(listed.data["servers"]).toMatchObject([
      { server: "sample", label: "Sample (free test server)", keys: [] },
      {
        server: "keyed",
        label: "Keyed test server",
        runs: "hosted",
        models: [
          { id: "keyed-image", is_default: true },
          { id: "keyed-image-large", is_default: false },
          { id: "keyed-speech", is_default: true },
        ],
        keys: [{ ...keyGuide, source: "missing" }],
      },
    ]);
  });

  it("list_media_tools gives key-file after the key is saved", async () => {
    const harness = await startHarness({
      mediaToolsFile: keyedFile,
      beforeConnect: () =>
        saveKey({ variable: "YUMEKIT_TEST_KEY", value: "made-up-value-3" }),
    });

    const listed = await harness.call({ name: "list_media_tools" });

    expect(listed.data["servers"]).toMatchObject([
      {},
      { keys: [{ variable: "YUMEKIT_TEST_KEY", source: "key-file" }] },
    ]);
  });

  it("generate_asset returns media-key-missing with the steps and makes no tool call", async () => {
    const harness = await startHarness({ mediaToolsFile: keyedFile });

    const result = await harness.call({
      name: "generate_asset",
      arguments: {
        asset_id: "fox",
        capability: "image",
        server: "keyed",
        input: { prompt: "a fox" },
      },
    });

    expect(result.isError).toBe(true);
    expect(result.data).toMatchObject({
      kind: "media-key-missing",
      server: "keyed",
      variable: keyGuide.variable,
      get_key_url: keyGuide.get_key_url,
      steps: keyGuide.steps,
    });
    expect(result.data["message"]).toContain(
      "Add the key in the editor under Tools, or run `yumekit keys set YUMEKIT_TEST_KEY`.",
    );
    expect(await filesIn(join(harness.folder, "assets", "files"))).toEqual([]);
    expect(harness.store.read().assets).toEqual([]);
  });

  it("registers no MCP tool that reads, sets, or removes a key", async () => {
    const harness = await startHarness();

    const { tools } = await harness.client.listTools();

    expect(tools.filter((tool) => /key/i.test(tool.name))).toEqual([]);
  });
});
