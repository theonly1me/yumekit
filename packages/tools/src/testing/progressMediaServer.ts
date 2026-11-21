import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { setTimeout as wait } from "node:timers/promises";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const server = new McpServer({
  name: "yumekit-progress-media",
  version: "0.0.0",
});

const stepMilliseconds = 50;

const progressSteps = [
  { progress: 1, total: 3, message: "Queued" },
  { progress: 2, total: 3, message: "Drawing" },
  { progress: 3, total: 3, message: "Done" },
];

server.registerTool(
  "generate_image",
  {
    inputSchema: {
      prompt: z.string(),
      output_directory: z.string(),
      file_stem: z.string(),
    },
  },
  async (...parameters) => {
    const [input, extra] = parameters;
    const progressToken = extra._meta?.progressToken;
    if (progressToken !== undefined) {
      for (const step of progressSteps) {
        await extra.sendNotification({
          method: "notifications/progress",
          params: { progressToken, ...step },
        });
        await wait(stepMilliseconds);
      }
    }
    await mkdir(input.output_directory, { recursive: true });
    const path = join(input.output_directory, `${input.file_stem}.png`);
    await writeFile(path, "not a real image");
    return {
      content: [],
      structuredContent: {
        files: [{ path, kind: "image", width_pixels: 1, height_pixels: 1 }],
      },
    };
  },
);

await server.connect(new StdioServerTransport());
