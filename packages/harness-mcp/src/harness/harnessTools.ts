import { tempoGridOf, type MadeBy, type ProjectStore } from "@yumekit/project";
import type { PictureRenderer } from "@yumekit/render";
import type { MediaTools } from "@yumekit/tools";
import { registerCastTools } from "../cast/registerCastTools.js";
import { registerAlignWords } from "../media/registerAlignWords.js";
import { registerImportAsset } from "../media/registerAssetFileTools.js";
import { registerGenerateAsset } from "../media/registerGenerateAsset.js";
import { registerGenerateAssets } from "../media/registerGenerateAssets.js";
import { registerMarkAsset } from "../media/registerMarkAsset.js";
import { registerPreviewAssets } from "../media/registerPreviewAssets.js";
import { registerRemoveAsset } from "../media/registerRemoveAsset.js";
import { registerPreviewTools } from "../output/registerPreviewTools.js";
import { registerScenePreviewTool } from "../output/registerScenePreviewTool.js";
import { registerRenderTools } from "../output/registerRenderTools.js";
import { registerSharperCopy } from "../output/registerSharperCopy.js";
import { registerAssetReadTools } from "../read/registerAssetReadTools.js";
import { registerProjectReadTools } from "../read/registerProjectReadTools.js";
import { registerListMediaRequests } from "../read/registerListMediaRequests.js";
import { registerReferenceTools } from "../read/registerReferenceTools.js";
import { registerSceneClipTools } from "../sceneClips/registerSceneClipTools.js";
import { registerPlatformTools } from "../story/registerPlatformTools.js";
import { registerPutScene } from "../story/registerPutScene.js";
import { registerSetProjectName } from "../story/registerSetProjectName.js";
import { registerSetVideoStyle } from "../story/registerSetVideoStyle.js";
import { registerSetChecks } from "../story/registerSetChecks.js";
import { registerSetLook } from "../story/registerSetLook.js";
import { registerStoryTools } from "../story/registerStoryTools.js";
import { registerNarrationAndHistoryTools } from "../timeline/registerNarrationTools.js";
import { registerPlaceSound } from "../timeline/registerPlaceSound.js";
import { registerPlaceVideo } from "../timeline/registerPlaceVideo.js";
import { registerTimelineTools } from "../timeline/registerTimelineTools.js";
import { registerContactSheet } from "../contactSheet/registerContactSheet.js";
import { registerPutSharedCode } from "../sharedCode/registerPutSharedCode.js";
import { registerSetFonts } from "../sharedCode/registerSetFonts.js";
import { registerSetTempo } from "../tempo/registerSetTempo.js";
import { registerReplaceMusic } from "../replace/registerReplaceMusic.js";
import { registerReplaceNarration } from "../replace/registerReplaceNarration.js";
import { registerSetTransitions } from "../transitions/registerSetTransitions.js";
import { registerGetWork } from "../work/registerGetWork.js";
import { registerPutWork } from "../work/registerPutWork.js";
import type { AskCritic } from "../critic/criticTypes.js";
import { registerReviewWork } from "../critic/registerReviewWork.js";
import type { AskHelper } from "../helpers/helperTypes.js";
import { registerAskHelper } from "../helpers/registerAskHelper.js";
import type { AskPerson } from "../questions/questionTypes.js";
import { registerAskPerson } from "../questions/registerAskPerson.js";
import { registerGetStoryGuide } from "../storyGuide/registerGetStoryGuide.js";
import { registerRecordLesson } from "../storyPlan/registerRecordLesson.js";
import { registerSetStoryPlan } from "../storyPlan/registerSetStoryPlan.js";
import { registerSetStory } from "../storyFirst/registerSetStory.js";
import { registerGetShotBrief } from "../storyPlan/shotBrief/registerGetShotBrief.js";
import { registerOpenTake } from "../takes/registerOpenTake.js";
import { registerReadyTake } from "../takes/registerReadyTake.js";
import { registerSetApprovePicturesFirst } from "../takes/registerSetApprovePicturesFirst.js";
import { registerSetChapters } from "../chapters/registerSetChapters.js";
import { registerPlacePicture } from "../timeline/registerPlacePicture.js";
import { clockedTool } from "../clock/clockedTool.js";
import type { FilmClock } from "../clock/filmClock.js";
import { createSerialWrites } from "./serialWrites.js";
import type { WorkBoard } from "../work/board/workBoard.js";
import { callerStore } from "./callerStore.js";
import { createToolTable, type HarnessTool } from "./toolTable.js";

export interface HarnessOptions {
  store: ProjectStore;
  mediaTools: MediaTools;
  askHelper?: AskHelper;
  askCritic?: AskCritic;
  askPerson?: AskPerson;
}

export function harnessToolsOf(
  options: HarnessOptions & {
    pictures: PictureRenderer;
    callerOf: () => MadeBy | undefined;
    board: WorkBoard;
    clock: FilmClock;
  },
): HarnessTool[] {
  const context = {
    tools: createToolTable({
      tempoGrid: () => tempoGridOf(options.store.read().project),
    }),
    mediaTools: options.mediaTools,
    pictures: options.pictures,
    store: callerStore({ store: options.store, callerOf: options.callerOf }),
    board: options.board,
    writeLatest: createSerialWrites(),
    clock: options.clock,
  };
  registerGetWork(context);
  registerProjectReadTools(context);
  registerAssetReadTools(context);
  registerReferenceTools(context);
  registerListMediaRequests(context);
  registerStoryTools(context);
  registerSetProjectName(context);
  registerCastTools(context);
  registerGetStoryGuide(context);
  registerSetStory(context);
  registerSetStoryPlan(context);
  registerSetChapters(context);
  registerRecordLesson(context);
  registerGetShotBrief(context);
  registerOpenTake(context);
  registerReadyTake(context);
  registerPlatformTools(context);
  registerSetVideoStyle(context);
  registerSetChecks(context);
  registerSetApprovePicturesFirst(context);
  registerSetLook(context);
  registerSetTempo(context);
  registerPutScene(context);
  registerPutSharedCode(context);
  registerPutWork(context);
  registerSetFonts(context);
  registerTimelineTools(context);
  registerNarrationAndHistoryTools(context);
  registerPlaceVideo(context);
  registerPlacePicture(context);
  registerPlaceSound(context);
  registerReplaceNarration(context);
  registerReplaceMusic(context);
  registerSceneClipTools(context);
  registerSetTransitions(context);
  registerGenerateAsset(context);
  registerGenerateAssets(context);
  registerImportAsset(context);
  registerRemoveAsset(context);
  registerMarkAsset(context);
  registerPreviewAssets(context);
  registerReviewWork({ ...context, askCritic: options.askCritic });
  registerAlignWords(context);
  registerPreviewTools(context);
  registerScenePreviewTool(context);
  registerContactSheet(context);
  registerRenderTools(context);
  registerSharperCopy(context);
  registerAskHelper({ ...context, askHelper: options.askHelper });
  registerAskPerson({ ...context, askPerson: options.askPerson });
  return context.tools.tools().map((tool) =>
    clockedTool({
      tool,
      clock: options.clock,
      read: () => options.store.read(),
      isPerson: () => options.callerOf() === "person",
    }),
  );
}
