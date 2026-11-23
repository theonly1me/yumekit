import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerDescribeTool } from "./catalog.ts";
import { registerMusicTool } from "./music/registerMusicTool.ts";
import { offeredStylesOf, type StyleEntry } from "./styles/styleList.ts";

export function createLocalMusicServer(options: {
  styles: readonly StyleEntry[];
  withWaitingStyles: boolean;
}): McpServer {
  const server = new McpServer({
    name: "yumekit-local-music",
    version: "0.0.0",
  });
  const offered = offeredStylesOf({
    entries: options.styles,
    withWaitingStyles: options.withWaitingStyles,
  });
  registerDescribeTool({ server, offered });
  if (offered.length > 0) registerMusicTool({ server, offered });
  return server;
}
