import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { ProjectStore } from "@yumekit/project";
import type { MediaTools } from "@yumekit/tools";

export interface HarnessContext {
  server: McpServer;
  store: ProjectStore;
  mediaTools: MediaTools;
}
