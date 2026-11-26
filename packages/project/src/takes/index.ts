import type { TakeStep } from "../format/takes.js";

export {
  cutItemId,
  storyItemId,
  takeStates,
  takeSteps,
  takeSchema,
  takeTextLimit,
  type Take,
  type TakeItem,
  type TakeNote,
  type TakeState,
  type TakeStep,
} from "../format/takes.js";
export { chapterSchema, type Chapter } from "../format/storyPlan.js";
export {
  chapterIdOfShot,
  chaptersOf,
  filmChapterId,
  filmChapterTitle,
  type ChapterPlan,
} from "./chapters.js";
export {
  chapterFramesOf,
  chapterIdsOfClips,
  videoClipComponent,
  type ChapterWork,
} from "./chapterTimes.js";
export {
  assetDecisionsOf,
  assetVerdictsOf,
  isAssetApproved,
  isRefusedByPerson,
  lastSentTakeOf,
  nextTakeNumberOf,
  openTakeOf,
  sentTakesOf,
  type AssetDecision,
  type AssetVerdict,
} from "./verdicts.js";

export const takeStepNames: Record<TakeStep, string> = {
  story: "the story",
  pictures: "the pictures",
  clips: "the clips and the music",
  cut: "the cut",
};
