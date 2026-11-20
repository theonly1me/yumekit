import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerImageTool } from "./image/registerImageTool.ts";
import type { SendRequest } from "./openAiApi.ts";

export const defaultImageModel = "gpt-image-2.5-flare";
export const imageModelVariable = "YUMEKIT_OPENAI_IMAGE_MODEL";

export function imageModelFrom(environment: NodeJS.ProcessEnv): string {
  const model = environment[imageModelVariable];
  if (model === undefined || model === "") return defaultImageModel;
  return model;
}

export function createOpenAiMediaServer(options: {
  environment: NodeJS.ProcessEnv;
  sendRequest: SendRequest;
}): McpServer {
  const server = new McpServer({
    name: "yumekit-openai-media",
    version: "0.0.0",
  });
  registerImageTool({
    server,
    apiKey: options.environment["OPENAI_API_KEY"],
    imageModel: imageModelFrom(options.environment),
    sendRequest: options.sendRequest,
  });
  return server;
}
