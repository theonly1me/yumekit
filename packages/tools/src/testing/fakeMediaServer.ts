import { join } from "node:path";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const server = new McpServer({ name: "yumekit-fake-media", version: "0.0.0" });

server.registerTool(
  "generate_image",
  { inputSchema: { prompt: z.string() } },
  () => ({
    content: [],
    structuredContent: { files: [{ path: "relative.png", kind: "picture" }] },
  }),
);

server.registerTool(
  "generate_speech",
  { inputSchema: { text: z.string() } },
  () => ({
    isError: true,
    content: [
      {
        type: "text",
        text: `YUMEKIT_FAKE_PASSED is ${process.env["YUMEKIT_FAKE_PASSED"] ?? "not set"}`,
      },
    ],
  }),
);

server.registerTool(
  "generate_music",
  { inputSchema: { output_directory: z.string() } },
  (input) => ({
    content: [],
    structuredContent: {
      files: [
        {
          path: join(input.output_directory, "..", "outside.wav"),
          kind: "audio",
        },
      ],
    },
  }),
);

server.registerTool(
  "generate_video",
  { inputSchema: { prompt: z.string() } },
  () => new Promise<never>(() => undefined),
);

await server.connect(new StdioServerTransport());
