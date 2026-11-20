import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerAlignTool } from "./align/registerAlignTool.ts";
import { registerCatalogTools } from "./catalog/registerCatalogTools.ts";
import { registerImageTool } from "./image/registerImageTool.ts";
import type { SendRequest } from "./openAiApi.ts";
import { registerSpeechTool } from "./speech/registerSpeechTool.ts";

export const modelSettings = {
  image: {
    variable: "YUMEKIT_OPENAI_IMAGE_MODEL",
    model: "gpt-image-2.5-flare",
  },
  speech: { variable: "YUMEKIT_OPENAI_SPEECH_MODEL", model: "gpt-4o-mini-tts" },
  align: { variable: "YUMEKIT_OPENAI_ALIGN_MODEL", model: "whisper-1" },
} as const;

function modelFrom(options: {
  environment: NodeJS.ProcessEnv;
  setting: { variable: string; model: string };
}): string {
  const model = options.environment[options.setting.variable];
  if (model === undefined || model === "") return options.setting.model;
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
  const { environment } = options;
  const shared = {
    server,
    apiKey: environment["OPENAI_API_KEY"],
    sendRequest: options.sendRequest,
  };
  const activeModels = {
    image: modelFrom({ environment, setting: modelSettings.image }),
    speech: modelFrom({ environment, setting: modelSettings.speech }),
    align: modelFrom({ environment, setting: modelSettings.align }),
  };
  registerCatalogTools({ ...shared, activeModels });
  registerImageTool({ ...shared, model: activeModels.image });
  registerSpeechTool({ ...shared, model: activeModels.speech });
  registerAlignTool({ ...shared, model: activeModels.align });
  return server;
}
