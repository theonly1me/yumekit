import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const keyVariable = "YUMEKIT_TEST_KEY";

const description = {
  label: "Checking test server",
  runs: "hosted",
  keys: [
    {
      variable: keyVariable,
      label: "Test key",
      get_key_url: "https://example.com/keys",
      steps: ["Open the key page.", "Copy the key."],
    },
  ],
  models: [
    {
      id: "checking-speech",
      label: "checking-speech",
      capability: "speech",
      is_default: true,
      settings: [],
      prices: [{ usd: 0.5, unit: "request", when: {} }],
      read_on: "2026-11-21",
    },
  ],
};

const server = new McpServer({
  name: "yumekit-checking-media",
  version: "0.0.0",
});

server.registerTool("describe_media_server", {}, () => ({
  content: [],
  structuredContent: { ...description },
}));

server.registerTool("check_key", {}, () => {
  const isSet = (process.env[keyVariable] ?? "") !== "";
  return {
    content: [],
    structuredContent: {
      valid: isSet,
      message: isSet ? "The server got a key." : "The server got no key.",
    },
  };
});

server.registerTool(
  "generate_speech",
  { inputSchema: { text: z.string(), model: z.string().optional() } },
  () => ({
    isError: true,
    content: [
      {
        type: "text",
        text: JSON.stringify({ key: process.env[keyVariable] ?? null }),
      },
    ],
  }),
);

await server.connect(new StdioServerTransport());
