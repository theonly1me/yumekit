#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { registerDescribeTool } from "./catalog.ts";
import { registerImageTool } from "./registerImageTool.ts";
import { registerMusicTool } from "./registerMusicTool.ts";
import { registerSoundEffectTool } from "./registerSoundEffectTool.ts";
import { registerSpeechTools } from "./registerSpeechTools.ts";
import { registerSharpenTool } from "./sharpen/registerSharpenTool.ts";
import { registerTalkingClipTool } from "./talking/registerTalkingClipTool.ts";
import { registerVideoTool } from "./video/registerVideoTool.ts";

const server = new McpServer({
  name: "yumekit-sample-media",
  version: "0.0.0",
});
registerDescribeTool(server);
registerImageTool(server);
registerSpeechTools(server);
registerMusicTool(server);
registerVideoTool(server);
registerSoundEffectTool(server);
registerTalkingClipTool(server);
registerSharpenTool(server);
await server.connect(new StdioServerTransport());
