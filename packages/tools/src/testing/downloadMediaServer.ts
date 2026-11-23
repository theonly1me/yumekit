import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { setTimeout as wait } from "node:timers/promises";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import type { RequestHandlerExtra } from "@modelcontextprotocol/sdk/shared/protocol.js";
import type {
  ServerNotification,
  ServerRequest,
} from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";

const server = new McpServer({ name: "yumekit-download-media", version: "0" });
const downloadBytes = 2_000_000;
const stepMilliseconds = 50;
let isReady = false;

async function download(
  extra: RequestHandlerExtra<ServerRequest, ServerNotification>,
): Promise<void> {
  const progressToken = extra._meta?.progressToken;
  if (!isReady && progressToken !== undefined) {
    await extra.sendNotification({
      method: "notifications/progress",
      params: {
        progressToken,
        progress: downloadBytes,
        total: downloadBytes,
        message: "Getting the test voice, one time, 2 MB",
      },
    });
    await wait(stepMilliseconds);
  }
  isReady = true;
}

server.registerTool("describe_media_server", {}, () => {
  const description = {
    label: "Download voice",
    runs: "on-this-computer",
    keys: [],
    models: [
      {
        id: "download-voice",
        label: "Download voice",
        capability: "speech",
        is_default: true,
        settings: [],
        prices: [],
        read_on: "2026-11-23",
        download: { bytes: downloadBytes, ready: isReady },
      },
    ],
  };
  return { content: [], structuredContent: description };
});

server.registerTool("prepare_model", {}, async (...parameters) => {
  const [extra] = parameters;
  await download(extra);
  return { content: [], structuredContent: { files: [] } };
});

server.registerTool(
  "generate_speech",
  {
    inputSchema: {
      text: z.string(),
      output_directory: z.string(),
      file_stem: z.string(),
    },
  },
  async (...parameters) => {
    const [input, extra] = parameters;
    await download(extra);
    await mkdir(input.output_directory, { recursive: true });
    const path = join(input.output_directory, `${input.file_stem}.wav`);
    await writeFile(path, "not a real sound");
    return {
      content: [],
      structuredContent: { files: [{ path, kind: "audio" }] },
    };
  },
);

await server.connect(new StdioServerTransport());
