import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { ProjectStore } from "@yumekit/project";
import type { MediaTools } from "@yumekit/tools";
import { serverInstructions } from "./instructions.js";
import { registerAlignWords } from "./media/registerAlignWords.js";
import { registerImportAsset } from "./media/registerAssetFileTools.js";
import { registerGenerateAsset } from "./media/registerGenerateAsset.js";
import { registerPreviewTools } from "./output/registerPreviewTools.js";
import { registerRenderTools } from "./output/registerRenderTools.js";
import { registerAssetReadTools } from "./read/registerAssetReadTools.js";
import { registerProjectReadTools } from "./read/registerProjectReadTools.js";
import { registerReferenceTools } from "./read/registerReferenceTools.js";
import { registerPutScene } from "./story/registerPutScene.js";
import { registerStoryTools } from "./story/registerStoryTools.js";
import { registerNarrationAndHistoryTools } from "./timeline/registerNarrationTools.js";
import { registerTimelineTools } from "./timeline/registerTimelineTools.js";

export function createHarnessServer(options: {
  store: ProjectStore;
  mediaTools: MediaTools;
}): McpServer {
  const server = new McpServer(
    { name: "yumekit", version: "0.0.0" },
    { instructions: serverInstructions },
  );
  const context = { server, ...options };
  registerProjectReadTools(context);
  registerAssetReadTools(context);
  registerReferenceTools(context);
  registerStoryTools(context);
  registerPutScene(context);
  registerTimelineTools(context);
  registerNarrationAndHistoryTools(context);
  registerGenerateAsset(context);
  registerImportAsset(context);
  registerAlignWords(context);
  registerPreviewTools(context);
  registerRenderTools(context);
  return server;
}
