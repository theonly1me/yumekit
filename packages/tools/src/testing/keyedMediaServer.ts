import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const keyVariable = "YUMEKIT_TEST_KEY";
const readOn = "2026-11-21";

const model = (options: {
  id: string;
  capability: string;
  isDefault: boolean;
}) => ({
  id: options.id,
  label: options.id,
  capability: options.capability,
  is_default: options.isDefault,
  settings: [],
  prices: [{ usd: 0.5, unit: "image", when: {} }],
  read_on: readOn,
});

const description = {
  label: "Keyed test server",
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
    model({ id: "keyed-image", capability: "image", isDefault: true }),
    model({ id: "keyed-image-large", capability: "image", isDefault: false }),
    model({ id: "keyed-speech", capability: "speech", isDefault: true }),
  ],
};

const server = new McpServer({ name: "yumekit-keyed-media", version: "0.0.0" });

server.registerTool("describe_media_server", {}, () => {
  const content = process.argv.includes("--invalid-description")
    ? { label: 5, models: "none" }
    : description;
  return { content: [], structuredContent: { ...content } };
});

server.registerTool(
  "generate_image",
  {
    inputSchema: {
      prompt: z.string(),
      model: z.string().optional(),
      output_directory: z.string(),
      file_stem: z.string(),
    },
  },
  async (input) => {
    if (!process.env[keyVariable]) {
      return {
        isError: true,
        content: [{ type: "text", text: `${keyVariable} is not set` }],
      };
    }
    await mkdir(input.output_directory, { recursive: true });
    const path = join(input.output_directory, `${input.file_stem}.png`);
    await writeFile(path, "not a real image");
    return {
      content: [],
      structuredContent: {
        files: [{ path, kind: "image", width_pixels: 1, height_pixels: 1 }],
        cost_usd: 0.5,
        cost_is_estimate: true,
      },
    };
  },
);

server.registerTool(
  "generate_speech",
  { inputSchema: { text: z.string(), model: z.string().optional() } },
  (input) => ({
    isError: true,
    content: [
      {
        type: "text",
        text: JSON.stringify({
          key: process.env[keyVariable] ?? null,
          not_passed: process.env["YUMEKIT_NOT_PASSED"] ?? null,
          model: input.model ?? null,
          process_id: process.pid,
        }),
      },
    ],
  }),
);

server.registerTool(
  "generate_music",
  { inputSchema: { prompt: z.string() } },
  () => ({
    isError: true,
    content: [{ type: "text", text: "The keyed test server makes no music." }],
  }),
);

await server.connect(new StdioServerTransport());
