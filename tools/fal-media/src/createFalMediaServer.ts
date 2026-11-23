import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerImageTool } from "./image/registerImageTool.ts";
import { registerCheckKeyTool } from "./checkKey/registerCheckKeyTool.ts";
import { describeServer } from "./describe/describeServer.ts";
import type { SendRequest } from "./falApi.ts";
import { registerSharpenTool } from "./sharper/registerSharpenTool.ts";
import { registerSoundEffectTool } from "./sound/registerSoundEffectTool.ts";
import { structuredResult } from "./toolResults.ts";
import { registerVideoTool } from "./video/registerVideoTool.ts";
import type { Wait } from "./queue/runQueueRequest.ts";

export function createFalMediaServer(options: {
  environment: NodeJS.ProcessEnv;
  sendRequest: SendRequest;
  wait: Wait;
}): McpServer {
  const server = new McpServer({ name: "yumekit-fal-media", version: "0.0.0" });
  const shared = {
    server,
    apiKey: options.environment["FAL_KEY"],
    sendRequest: options.sendRequest,
    wait: options.wait,
  };
  server.registerTool(
    "describe_media_server",
    {
      description:
        "Describe this server: its key, its picture, video, sound effect, and sharper copy models, their settings, and their prices. Needs no key and makes no request.",
    },
    () => structuredResult(describeServer()),
  );
  registerImageTool(shared);
  registerVideoTool(shared);
  registerSoundEffectTool(shared);
  registerSharpenTool(shared);
  registerCheckKeyTool(shared);
  return server;
}
