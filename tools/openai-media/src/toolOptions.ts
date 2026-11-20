import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { SendRequest } from "./openAiApi.ts";

export interface ToolOptions {
  server: McpServer;
  apiKey: string | undefined;
  model: string;
  sendRequest: SendRequest;
}
