#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { registerImageTool } from "./registerImageTool.ts";
import { registerMusicTool } from "./registerMusicTool.ts";
import { registerSpeechTools } from "./registerSpeechTools.ts";
import { registerVideoTool } from "./video/registerVideoTool.ts";

const server = new McpServer({
  name: "yumekit-sample-media",
  version: "0.0.0",
});
registerImageTool(server);
registerSpeechTools(server);
registerMusicTool(server);
registerVideoTool(server);
await server.connect(new StdioServerTransport());
