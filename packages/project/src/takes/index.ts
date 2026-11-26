import type { TakeStep } from "../format/takes.js";

export {
  cutItemId,
  storyItemId,
  takeStates,
  takeSteps,
  takeSchema,
  takeTagLimit,
  takeTextLimit,
  type Take,
  type TakeItem,
  type TakeNote,
  type TakeState,
  type TakeStep,
} from "../format/takes.js";
export {
  draftItemIdSchema,
  draftMarkLimit,
  draftVerdicts,
  itemDraftSchema,
  takeDraftSchema,
  type DraftVerdict,
  type ItemDraft,
  type TakeDraft,
} from "../format/takeDrafts.js";
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
export { nextWorkOf, takeTitleInTextOf, takeTitleOf } from "./takeTitles.js";
export {
  assetDecisionsOf,
  assetVerdictsOf,
  isAssetApproved,
  isRefusedByPerson,
  lastSentTakeOf,
  nextTakeNumberOf,
  noteVerdictOf,
  noteVerdictsOf,
  openTakeOf,
  sentTakesOf,
  unapprovedItemIdsOf,
  type AssetDecision,
  type AssetVerdict,
} from "./verdicts.js";
export {
  currentTakesOf,
  isTakeReplaced,
  isTakeWaiting,
  newestLaterTakeOf,
  newestTakeOf,
  replacingTakeOf,
  waitingTakesOf,
} from "./newestTakes.js";
export {
  inUseByPlaceOf,
  personPicksOf,
  placeKeyOf,
  placeOf,
  type Place,
  type PlaceAsset,
  type PlaceFacts,
  type PlaceSheet,
} from "./places.js";
export {
  listTextOf,
  noReviewCounts,
  reviewCountTextOf,
  reviewCountsOf,
  reviewTotalOf,
  type ReviewCounts,
} from "./reviewCounts.js";

export const takeStepNames: Record<TakeStep, string> = {
  story: "the story",
  pictures: "the pictures",
  clips: "the clips and the music",
  cut: "the cut",
};
