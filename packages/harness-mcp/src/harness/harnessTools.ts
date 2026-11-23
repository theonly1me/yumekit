import type { MadeBy, ProjectStore } from "@yumekit/project";
import type { PictureRenderer } from "@yumekit/render";
import type { MediaTools } from "@yumekit/tools";
import { registerCastTools } from "../cast/registerCastTools.js";
import { registerAlignWords } from "../media/registerAlignWords.js";
import { registerImportAsset } from "../media/registerAssetFileTools.js";
import { registerGenerateAsset } from "../media/registerGenerateAsset.js";
import { registerRemoveAsset } from "../media/registerRemoveAsset.js";
import { registerPreviewTools } from "../output/registerPreviewTools.js";
import { registerScenePreviewTool } from "../output/registerScenePreviewTool.js";
import { registerRenderTools } from "../output/registerRenderTools.js";
import { registerSharperCopy } from "../output/registerSharperCopy.js";
import { registerAssetReadTools } from "../read/registerAssetReadTools.js";
import { registerProjectReadTools } from "../read/registerProjectReadTools.js";
import { registerReferenceTools } from "../read/registerReferenceTools.js";
import { registerSceneClipTools } from "../sceneClips/registerSceneClipTools.js";
import { registerPlatformTools } from "../story/registerPlatformTools.js";
import { registerPutScene } from "../story/registerPutScene.js";
import { registerSetProjectName } from "../story/registerSetProjectName.js";
import { registerSetVideoStyle } from "../story/registerSetVideoStyle.js";
import { registerSetLook } from "../story/registerSetLook.js";
import { registerStoryTools } from "../story/registerStoryTools.js";
import { registerNarrationAndHistoryTools } from "../timeline/registerNarrationTools.js";
import { registerPlaceSound } from "../timeline/registerPlaceSound.js";
import { registerPlaceVideo } from "../timeline/registerPlaceVideo.js";
import { registerTimelineTools } from "../timeline/registerTimelineTools.js";
import { registerReplaceMusic } from "../replace/registerReplaceMusic.js";
import { registerReplaceNarration } from "../replace/registerReplaceNarration.js";
import { registerSetTransitions } from "../transitions/registerSetTransitions.js";
import { callerStore } from "./callerStore.js";
import { createToolTable, type HarnessTool } from "./toolTable.js";

export interface HarnessOptions {
  store: ProjectStore;
  mediaTools: MediaTools;
}

export function harnessToolsOf(
  options: HarnessOptions & {
    pictures: PictureRenderer;
    callerOf: () => MadeBy | undefined;
  },
): HarnessTool[] {
  const context = {
    tools: createToolTable(),
    mediaTools: options.mediaTools,
    pictures: options.pictures,
    store: callerStore({ store: options.store, callerOf: options.callerOf }),
  };
  registerProjectReadTools(context);
  registerAssetReadTools(context);
  registerReferenceTools(context);
  registerStoryTools(context);
  registerSetProjectName(context);
  registerCastTools(context);
  registerPlatformTools(context);
  registerSetVideoStyle(context);
  registerSetLook(context);
  registerPutScene(context);
  registerTimelineTools(context);
  registerNarrationAndHistoryTools(context);
  registerPlaceVideo(context);
  registerPlaceSound(context);
  registerReplaceNarration(context);
  registerReplaceMusic(context);
  registerSceneClipTools(context);
  registerSetTransitions(context);
  registerGenerateAsset(context);
  registerImportAsset(context);
  registerRemoveAsset(context);
  registerAlignWords(context);
  registerPreviewTools(context);
  registerScenePreviewTool(context);
  registerRenderTools(context);
  registerSharperCopy(context);
  return context.tools.tools();
}
