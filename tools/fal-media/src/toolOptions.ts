import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { SendRequest } from "./falApi.ts";
import type { Wait } from "./queue/runQueueRequest.ts";

export interface ToolOptions {
  server: McpServer;
  apiKey: string | undefined;
  sendRequest: SendRequest;
  wait: Wait;
}

export function withoutKey(options: {
  message: string;
  apiKey: string;
}): string {
  return options.message.replaceAll(options.apiKey, "[FAL_KEY]");
}
