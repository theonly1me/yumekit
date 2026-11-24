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

export async function planCostOf(options: {
  mediaTools: MediaTools;
  bible: Bible;
  plan: StoryPlan;
}): Promise<number> {
  const { mediaTools, plan } = options;
  const sheetPictures = planMembersOf(options).reduce(
    (...[total, member]) =>
      total + Math.max(1, (member.sheetPrompts ?? []).length),
    0,
  );
  const pictures = sheetPictures + plan.shots.length;
  const seconds =
    plan.shots.reduce((...[total, shot]) => total + shot.seconds, 0) +
    retrySecondsOf(plan.shots);
  const imageModel =
    (await strongestModelOf({ mediaTools, capability: "image" })) ??
    (await mediaTools.chosenModel({ capability: "image" }));
  const videoModel = await mediaTools.chosenModel({ capability: "video" });
  const usd =
    pictures * priceOf({ model: imageModel, capability: "image" }) +
    seconds * priceOf({ model: videoModel, capability: "video" });
  return Math.round(usd * 100) / 100;
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
