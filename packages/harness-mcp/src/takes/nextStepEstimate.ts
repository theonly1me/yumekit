import {
  chaptersOf,
  type ProjectSnapshot,
  type StoryPlan,
  type Take,
} from "@yumekit/project";
import type { MediaTools } from "@yumekit/tools";
import {
  centsOf,
  picturesOfPlan,
  unitPricesOf,
  type UnitPrices,
} from "../storyPlan/planCost.js";

function chapterPlanOf(options: {
  plan: StoryPlan;
  chapterId: string | undefined;
}): StoryPlan | undefined {
  const { plan } = options;
  const chapters = chaptersOf(plan);
  const chapter =
    options.chapterId === undefined
      ? chapters[0]
      : chapters.find((candidate) => candidate.id === options.chapterId);
  if (chapter === undefined) return undefined;
  return {
    ...plan,
    shots: plan.shots.filter((shot) => chapter.shotIds.includes(shot.id)),
  };
}

function nextChapterIdOf(options: {
  plan: StoryPlan;
  chapterId: string | undefined;
}): string | undefined {
  const chapters = chaptersOf(options.plan);
  const index = chapters.findIndex(
    (chapter) => chapter.id === options.chapterId,
  );
  return index === -1 ? undefined : chapters[index + 1]?.id;
}

function estimateOf(options: {
  snapshot: ProjectSnapshot;
  plan: StoryPlan;
  take: Take;
  prices: UnitPrices;
}): number | undefined {
  const { snapshot, plan, take, prices } = options;
  const { bible } = snapshot;
  const picturesOf = (chapterId: string | undefined) => {
    const chapterPlan = chapterPlanOf({ plan, chapterId });
    return chapterPlan === undefined
      ? undefined
      : picturesOfPlan({ bible, plan: chapterPlan }) * prices.pictureUsd;
  };
  switch (take.step) {
    case "story":
      return picturesOf(undefined);
    case "pictures": {
      const chapterPlan = chapterPlanOf({ plan, chapterId: take.chapterId });
      return chapterPlan?.shots.reduce(
        (...[total, shot]) => total + shot.seconds * prices.videoSecondUsd,
        0,
      );
    }
    case "clips":
      return 0;
    case "cut": {
      const next = nextChapterIdOf({ plan, chapterId: take.chapterId });
      return next === undefined ? 0 : picturesOf(next);
    }
  }
}

export async function nextStepEstimateOf(options: {
  snapshot: ProjectSnapshot;
  mediaTools: MediaTools;
  take: Take;
  given: number | undefined;
}): Promise<number | undefined> {
  const { snapshot, take } = options;
  const plan = snapshot.bible.storyPlan;
  if (plan === undefined) {
    return take.step === "clips" || take.step === "cut" ? 0 : options.given;
  }
  const estimate = estimateOf({
    snapshot,
    plan,
    take,
    prices: await unitPricesOf(options.mediaTools),
  });
  return estimate === undefined ? options.given : centsOf(estimate);
}
