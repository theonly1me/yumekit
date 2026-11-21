import type { ProjectStore } from "@yumekit/project";
import type { MediaTools } from "@yumekit/tools";
import { registerAlignWords } from "../media/registerAlignWords.js";
import { registerImportAsset } from "../media/registerAssetFileTools.js";
import { registerGenerateAsset } from "../media/registerGenerateAsset.js";
import { registerPreviewTools } from "../output/registerPreviewTools.js";
import { registerRenderTools } from "../output/registerRenderTools.js";
import { registerAssetReadTools } from "../read/registerAssetReadTools.js";
import { registerProjectReadTools } from "../read/registerProjectReadTools.js";
import { registerReferenceTools } from "../read/registerReferenceTools.js";
import { registerPutScene } from "../story/registerPutScene.js";
import { registerStoryTools } from "../story/registerStoryTools.js";
import { registerNarrationAndHistoryTools } from "../timeline/registerNarrationTools.js";
import { registerPlaceVideo } from "../timeline/registerPlaceVideo.js";
import { registerTimelineTools } from "../timeline/registerTimelineTools.js";
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
  registerPutScene(context);
  registerTimelineTools(context);
  registerNarrationAndHistoryTools(context);
  registerPlaceVideo(context);
  registerGenerateAsset(context);
  registerImportAsset(context);
  registerAlignWords(context);
  registerPreviewTools(context);
  registerRenderTools(context);
  return context.tools.tools();
}
