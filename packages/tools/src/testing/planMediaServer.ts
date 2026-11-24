import { appendFile, mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const planState = process.env["YUMEKIT_PLAN_STATE"] ?? "ready";
const signedOutMessage =
  "Codex is not signed in. Open a terminal and run: codex login.";

const description = {
  label: "Plan test server",
  runs: "hosted",
  keys: [],
  models: [
    {
      id: "plan-image",
      label: "plan-image",
      capability: "image",
      is_default: true,
      settings: [],
      prices: [{ usd: 0, unit: "image", when: {} }],
      read_on: "2026-11-24",
    },
  ],
};

async function noteCall(tool: string): Promise<void> {
  const file = process.env["YUMEKIT_PRICED_CALLS"];
  if (file) await appendFile(file, `plan ${tool}\n`);
}

const server = new McpServer({ name: "yumekit-plan-media", version: "0.0.0" });

server.registerTool("describe_media_server", {}, () => ({
  content: [],
  structuredContent: { ...description },
}));

server.registerTool("check_key", {}, async () => {
  await noteCall("check_key");
  const valid = planState !== "signed-out";
  const message = valid ? "Codex is ready." : signedOutMessage;
  return { content: [], structuredContent: { valid, message } };
});

const imageInput = {
  prompt: z.string(),
  output_directory: z.string(),
  file_stem: z.string(),
};

server.registerTool(
  "generate_image",
  { inputSchema: imageInput },
  async (input) => {
    await noteCall("generate_image");
    if (planState === "usage-limit") {
      return {
        isError: true,
        content: [
          { type: "text" as const, text: "You’ve hit your usage limit." },
        ],
        _meta: { "yumekit/failure": "usage-limit-reached" },
      };
    }
    await mkdir(input.output_directory, { recursive: true });
    const path = join(input.output_directory, `${input.file_stem}.png`);
    await writeFile(path, "made");
    return {
      content: [],
      structuredContent: { files: [{ path, kind: "image" }], cost_usd: 0 },
    };
  },
);

await server.connect(new StdioServerTransport());
