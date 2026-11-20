import { fileURLToPath } from "node:url";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { describe, expect, it, onTestFinished } from "vitest";

async function descriptionsByName(): Promise<Map<string, string>> {
  const client = new Client({ name: "sample-media-test", version: "0.0.0" });
  await client.connect(
    new StdioClientTransport({
      command: process.execPath,
      args: [fileURLToPath(new URL("main.ts", import.meta.url))],
    }),
  );
  onTestFinished(() => client.close());
  const { tools } = await client.listTools();
  return new Map(tools.map((tool) => [tool.name, tool.description ?? ""]));
}

const realOutputByTool = {
  generate_image: "with the prompt written on it as text",
  generate_speech: "one quiet tone",
  generate_music: "one low tone",
  align_words: "Spreads the words evenly",
  generate_video: "with a frame counter as large text",
} as const;

describe("sample media tool descriptions", () => {
  it("says that each tool is a test tool and what it really produces", async () => {
    const descriptions = await descriptionsByName();

    expect([...descriptions.keys()].toSorted()).toEqual(
      [...Object.keys(realOutputByTool), "describe_media_server"].toSorted(),
    );
    for (const [name, realOutput] of Object.entries(realOutputByTool)) {
      expect(descriptions.get(name)).toMatch(/^Test tool, free, no model\./);
      expect(descriptions.get(name)).toContain(realOutput);
    }
  });
});
