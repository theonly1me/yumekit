import type { HarnessContext } from "../context.js";
import { registerCheckMusic } from "../music/registerCheckMusic.js";
import { registerReviewClip } from "../storyPlan/registerReviewClip.js";
import { createCriticDesk } from "./criticDesk.js";
import { registerCheckDesign } from "./design/registerCheckDesign.js";
import type { AskCritic } from "./criticTypes.js";
import { registerReviewPlan } from "./plan/registerReviewPlan.js";
import { registerCriticTools } from "./registerCriticTools.js";
import { registerReviewSeveral } from "./registerReviewSeveral.js";
import { registerReviewStart } from "./start/registerReviewStart.js";
import { registerReviewSheet } from "./sheet/registerReviewSheet.js";

export function registerReviewWork(
  context: HarnessContext & { askCritic: AskCritic | undefined },
): void {
  const reviewContext = { ...context, critics: createCriticDesk() };
  registerReviewClip(reviewContext);
  registerReviewSheet(reviewContext);
  registerReviewPlan(reviewContext);
  registerReviewStart(reviewContext);
  registerReviewSeveral(reviewContext);
  registerCheckMusic(context);
  registerCheckDesign(context);
  if (context.askCritic !== undefined) registerCriticTools(reviewContext);
}
