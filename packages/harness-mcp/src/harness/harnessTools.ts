import type { ProjectStore } from "@yumekit/project";
import type { MediaTools } from "@yumekit/tools";
import { registerCastTools } from "../cast/registerCastTools.js";
import { registerAlignWords } from "../media/registerAlignWords.js";
import { registerImportAsset } from "../media/registerAssetFileTools.js";
import { registerGenerateAsset } from "../media/registerGenerateAsset.js";
import { registerRemoveAsset } from "../media/registerRemoveAsset.js";
import { registerPreviewTools } from "../output/registerPreviewTools.js";
import { registerScenePreviewTool } from "../output/registerScenePreviewTool.js";
import { registerRenderTools } from "../output/registerRenderTools.js";
import { registerAssetReadTools } from "../read/registerAssetReadTools.js";
import { registerProjectReadTools } from "../read/registerProjectReadTools.js";
import { registerReferenceTools } from "../read/registerReferenceTools.js";
import { registerSceneClipTools } from "../sceneClips/registerSceneClipTools.js";
import { registerPlatformTools } from "../story/registerPlatformTools.js";
import { registerPutScene } from "../story/registerPutScene.js";
import { registerSetVideoStyle } from "../story/registerSetVideoStyle.js";
import { registerSetLook } from "../story/registerSetLook.js";
import { registerStoryTools } from "../story/registerStoryTools.js";
import { registerNarrationAndHistoryTools } from "../timeline/registerNarrationTools.js";
import { registerPlaceVideo } from "../timeline/registerPlaceVideo.js";
import { registerTimelineTools } from "../timeline/registerTimelineTools.js";
import { registerSetTransitions } from "../transitions/registerSetTransitions.js";
import { createToolTable, type HarnessTool } from "./toolTable.js";

export interface HarnessOptions {
  store: ProjectStore;
  mediaTools: MediaTools;
}

export function harnessToolsOf(options: HarnessOptions): HarnessTool[] {
  const context = { tools: createToolTable(), ...options };
  registerProjectReadTools(context);
  registerAssetReadTools(context);
  registerReferenceTools(context);
  registerStoryTools(context);
  registerCastTools(context);
  registerPlatformTools(context);
  registerSetVideoStyle(context);
  registerSetLook(context);
  registerPutScene(context);
  registerTimelineTools(context);
  registerNarrationAndHistoryTools(context);
  registerPlaceVideo(context);
  registerSceneClipTools(context);
  registerSetTransitions(context);
  registerGenerateAsset(context);
  registerImportAsset(context);
  registerRemoveAsset(context);
  registerAlignWords(context);
  registerPreviewTools(context);
  registerScenePreviewTool(context);
  registerRenderTools(context);
  return context.tools.tools();
}
