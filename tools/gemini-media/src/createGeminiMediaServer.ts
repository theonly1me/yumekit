import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerDescribeTool } from "./describe/registerDescribeTool.ts";
import type { SendRequest } from "./geminiApi.ts";
import { registerImageTool } from "./image/registerImageTool.ts";
import { registerCheckKeyTool } from "./key/registerCheckKeyTool.ts";
import { registerMusicTool } from "./music/registerMusicTool.ts";
import { registerSpeechTool } from "./speech/registerSpeechTool.ts";
import { registerVideoTool } from "./video/registerVideoTool.ts";
import type { Wait } from "./interactions/requestOutput.ts";
import { videoModel } from "./video/videoModel.ts";

function configuredVideoModel(environment: NodeJS.ProcessEnv): string {
  const model = environment[videoModel.modelVariable];
  if (model === undefined || model === "") return videoModel.id;
  return model;
}

export function createGeminiMediaServer(options: {
  environment: NodeJS.ProcessEnv;
  sendRequest: SendRequest;
  wait: Wait;
}): McpServer {
  const server = new McpServer({
    name: "yumekit-gemini-media",
    version: "0.0.0",
  });
  const { environment, sendRequest } = options;
  const apiKey = environment["GEMINI_API_KEY"];
  const model = configuredVideoModel(environment);
  registerVideoTool({
    server,
    apiKey,
    model,
    environment,
    sendRequest,
    wait: options.wait,
  });
  const tools = { server, apiKey, sendRequest, wait: options.wait };
  registerImageTool(tools);
  registerSpeechTool(tools);
  registerMusicTool(tools);
  registerDescribeTool(server);
  registerCheckKeyTool({ server, apiKey, model, sendRequest });
  return server;
}
