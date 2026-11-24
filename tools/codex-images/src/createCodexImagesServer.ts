import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerCatalogTools } from "./catalog.ts";
import {
  registerImageTool,
  type CodexImagesOptions,
} from "./picture/registerImageTool.ts";

export type { CodexImagesOptions };

export function createCodexImagesServer(
  settings: CodexImagesOptions,
): McpServer {
  const server = new McpServer({
    name: "yumekit-codex-images",
    version: "0.0.0",
  });
  registerCatalogTools({
    server,
    findProgram: settings.findProgram,
    environment: settings.environment,
  });
  registerImageTool({ server, settings });
  return server;
}
