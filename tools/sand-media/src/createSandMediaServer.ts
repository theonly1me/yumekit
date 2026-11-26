import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerDescribeTool } from "./describe/registerDescribeTool.ts";
import { registerCheckKeyTool } from "./key/registerCheckKeyTool.ts";
import { keyVariable, type SendRequest } from "./sandApi.ts";
import { registerVideoTool } from "./video/registerVideoTool.ts";
import type { Wait } from "./video/runTask.ts";

export function createSandMediaServer(options: {
  environment: NodeJS.ProcessEnv;
  sendRequest: SendRequest;
  wait: Wait;
}): McpServer {
  const server = new McpServer({
    name: "yumekit-sand-media",
    version: "0.0.0",
  });
  const apiKey = options.environment[keyVariable];
  const { sendRequest } = options;
  registerVideoTool({ server, apiKey, sendRequest, wait: options.wait });
  registerDescribeTool(server);
  registerCheckKeyTool({ server, apiKey, sendRequest });
  return server;
}
