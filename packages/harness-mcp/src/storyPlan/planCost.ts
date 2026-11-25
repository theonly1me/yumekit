import {
  planBudgetOf,
  retrySecondsOf,
  type Bible,
  type PlanBudget,
  type StoryPlan,
} from "@yumekit/project";
import {
  cautiousPrices,
  type MediaModel,
  type MediaTools,
} from "@yumekit/tools";
import {
  basePriceOf,
  strongestModelOf,
  type StrongCapability,
} from "../media/strongModel.js";
import { planMembersOf } from "./planKey.js";

function priceOf(options: {
  model: MediaModel | undefined;
  capability: StrongCapability;
}): number {
  const { model, capability } = options;
  const known =
    model === undefined ? undefined : basePriceOf({ model, capability });
  return known ?? cautiousPrices[capability].usd;
}

export interface UnitPrices {
  pictureUsd: number;
  videoSecondUsd: number;
}

export async function unitPricesOf(
  mediaTools: MediaTools,
): Promise<UnitPrices> {
  const imageModel =
    (await strongestModelOf({ mediaTools, capability: "image" })) ??
    (await mediaTools.chosenModel({ capability: "image" }));
  const videoModel = await mediaTools.chosenModel({ capability: "video" });
  return {
    pictureUsd: priceOf({ model: imageModel, capability: "image" }),
    videoSecondUsd: priceOf({ model: videoModel, capability: "video" }),
  };
}

export function centsOf(usd: number): number {
  return Math.round(usd * 100) / 100;
}

export function picturesOfPlan(options: {
  bible: Bible;
  plan: StoryPlan;
}): number {
  const sheetPictures = planMembersOf(options).reduce(
    (...[total, member]) =>
      total + Math.max(1, (member.sheetPrompts ?? []).length),
    0,
  );
  return sheetPictures + options.plan.shots.length;
}

export async function planCostOf(options: {
  mediaTools: MediaTools;
  bible: Bible;
  plan: StoryPlan;
}): Promise<number> {
  const { plan } = options;
  const seconds =
    plan.shots.reduce((...[total, shot]) => total + shot.seconds, 0) +
    retrySecondsOf(plan.shots);
  const prices = await unitPricesOf(options.mediaTools);
  return centsOf(
    picturesOfPlan(options) * prices.pictureUsd +
      seconds * prices.videoSecondUsd,
  );
}

export async function planBudgetWith(options: {
  mediaTools: MediaTools;
  bible: Bible;
  plan: StoryPlan;
}): Promise<PlanBudget> {
  const limits = options.mediaTools.limits();
  return planBudgetOf({
    shots: options.plan.shots,
    estimateUsd: await planCostOf(options),
    limitSeconds: limits.generatedVideoSeconds,
    limitUsd: limits.spendingUsd,
  });
}
